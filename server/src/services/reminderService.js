const { query } = require('../db/pool');
const HttpError = require('../utils/httpError');
const { SLOT_KEYS } = require('../constants/slots');
const { todayIso, shiftIsoDay } = require('../utils/dates');

// Missing slots are recomputed from current readings, so the reminder shrinks and then
// disappears as the patient logs what they missed, without anyone updating the log row.
async function currentReminder(userId) {
  const today = todayIso();
  const { rows } = await query(
    `SELECT rl.id, rl.reminder_date::text AS date,
            ARRAY(
              SELECT t.slot FROM unnest($2::text[]) WITH ORDINALITY AS t(slot, position)
              WHERE NOT EXISTS (
                SELECT 1 FROM readings r
                WHERE r.user_id = rl.user_id AND r.reading_date = rl.reminder_date AND r.slot = t.slot
              )
              ORDER BY t.position
            ) AS "missingSlots"
     FROM reminder_logs rl
     WHERE rl.user_id = $1 AND rl.dismissed_at IS NULL AND rl.reminder_date >= $3
     ORDER BY rl.reminder_date DESC`,
    [userId, SLOT_KEYS, shiftIsoDay(today, -1)],
  );
  return rows.find((row) => row.missingSlots.length > 0) ?? null;
}

async function dismissReminder(userId, id) {
  const { rowCount } = await query(
    'UPDATE reminder_logs SET dismissed_at = now() WHERE id = $1 AND user_id = $2 AND dismissed_at IS NULL',
    [id, userId],
  );
  if (rowCount === 0) throw new HttpError(404, 'Reminder not found.');
}

module.exports = { currentReminder, dismissReminder };
