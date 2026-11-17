const { query, withTransaction } = require('../db/pool');
const HttpError = require('../utils/httpError');
const { invalidateReports } = require('../cache/reportCache');
const { SLOT_KEYS, MAX_READINGS_PER_DAY, slotLabel } = require('../constants/slots');

const UNIQUE_VIOLATION = '23505';
const READING_COLUMNS = 'id, reading_date AS date, slot, value';

function slotTakenError(slot) {
  const label = slotLabel(slot);
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
  return new HttpError(400, `You already have ${article} ${label} reading for this date.`, 'slot');
}

// Checking the day's count before the slot keeps "max 4 per day" reachable; with 4 slots a full day
// would otherwise always hit the slot error first.
async function assertCanUseSlot(db, userId, { date, slot }, excludeId = null) {
  const { rows } = await db.query(
    `SELECT slot FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)`,
    [userId, date, excludeId],
  );
  if (rows.length >= MAX_READINGS_PER_DAY) {
    throw new HttpError(400, `You can add only ${MAX_READINGS_PER_DAY} readings per day.`);
  }
  if (rows.some((row) => row.slot === slot)) throw slotTakenError(slot);
}

async function listReadings(userId, { from, to, page = 1, limit = 20 } = {}) {
  const filter = `user_id = $1
    AND ($2::date IS NULL OR reading_date >= $2)
    AND ($3::date IS NULL OR reading_date <= $3)`;
  const filterParams = [userId, from ?? null, to ?? null];

  const [list, count] = await Promise.all([
    query(
      `SELECT ${READING_COLUMNS} FROM readings
       WHERE ${filter}
       ORDER BY reading_date DESC, array_position($4::text[], slot)
       LIMIT $5 OFFSET $6`,
      [...filterParams, SLOT_KEYS, limit, (page - 1) * limit],
    ),
    query(`SELECT count(*)::int AS total FROM readings WHERE ${filter}`, filterParams),
  ]);

  return { readings: list.rows, page, limit, total: count.rows[0].total };
}

// Serialises one user's writes so a concurrent request can't slip in between the count check and the write.
function lockUserReadings(db, userId) {
  return db.query('SELECT pg_advisory_xact_lock($1)', [userId]);
}

async function createReading(userId, input) {
  try {
    const reading = await withTransaction(async (db) => {
      await lockUserReadings(db, userId);
      await assertCanUseSlot(db, userId, input);
      const { rows } = await db.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)
         RETURNING ${READING_COLUMNS}`,
        [userId, input.date, input.slot, input.value],
      );
      return rows[0];
    });
    await invalidateReports(userId);
    return reading;
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw slotTakenError(input.slot);
    throw err;
  }
}

async function updateReading(userId, id, input) {
  await findOwnedReading(userId, id);
  try {
    const reading = await withTransaction(async (db) => {
      await lockUserReadings(db, userId);
      await assertCanUseSlot(db, userId, input, id);
      const { rows } = await db.query(
        `UPDATE readings
         SET reading_date = $3, slot = $4, value = $5, updated_at = now()
         WHERE id = $1 AND user_id = $2
         RETURNING ${READING_COLUMNS}`,
        [id, userId, input.date, input.slot, input.value],
      );
      return rows[0];
    });
    await invalidateReports(userId);
    return reading;
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) throw slotTakenError(input.slot);
    throw err;
  }
}

async function deleteReading(userId, id) {
  const { rowCount } = await query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [id, userId]);
  if (rowCount === 0) throw new HttpError(404, 'Reading not found.');
  await invalidateReports(userId);
}

// Someone else's reading gets the same 404 as a missing one, so ids can't be probed.
async function findOwnedReading(userId, id) {
  const { rows } = await query(
    `SELECT ${READING_COLUMNS} FROM readings WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  if (!rows[0]) throw new HttpError(404, 'Reading not found.');
  return rows[0];
}

module.exports = { listReadings, createReading, updateReading, deleteReading };
