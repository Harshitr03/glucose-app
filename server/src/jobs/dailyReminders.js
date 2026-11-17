const { query } = require('../db/pool');
const { todayIso } = require('../utils/dates');
const { SLOT_KEYS, MAX_READINGS_PER_DAY } = require('../constants/slots');

// ON CONFLICT makes reruns of the same day (BullMQ retries, a manual run) log nobody twice.
async function logDailyReminders(date = todayIso()) {
  const { rows } = await query(
    `INSERT INTO reminder_logs (user_id, reminder_date, readings_count, missing_slots)
     SELECT u.id, $1::date, count(r.id)::int,
            ARRAY(
              SELECT t.slot FROM unnest($2::text[]) WITH ORDINALITY AS t(slot, position)
              WHERE NOT EXISTS (
                SELECT 1 FROM readings x WHERE x.user_id = u.id AND x.reading_date = $1 AND x.slot = t.slot
              )
              ORDER BY t.position
            )
     FROM users u
     LEFT JOIN readings r ON r.user_id = u.id AND r.reading_date = $1
     WHERE u.role = 'patient'
     GROUP BY u.id
     HAVING count(r.id) < $3
     ON CONFLICT (user_id, reminder_date) DO NOTHING
     RETURNING user_id AS "userId", readings_count AS "readingsCount", missing_slots AS "missingSlots"`,
    [date, SLOT_KEYS, MAX_READINGS_PER_DAY],
  );
  return { date, logged: rows };
}

module.exports = { logDailyReminders };
