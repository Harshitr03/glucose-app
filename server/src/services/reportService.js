const { query } = require('../db/pool');
const { reportRanges } = require('../utils/dates');
const { SLOT_KEYS, slotLabel } = require('../constants/slots');

const TARGET_LOW = 70;
const TARGET_HIGH = 180;

async function summarize(userId, { from, to }) {
  const { rows } = await query(
    `SELECT count(*)::int AS count,
            max(value) AS highest,
            min(value) AS lowest,
            round(avg(value), 1)::float AS average,
            count(*) FILTER (WHERE value BETWEEN $4 AND $5)::int AS "inRange"
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to, TARGET_LOW, TARGET_HIGH],
  );
  return { from, to, ...rows[0] };
}

async function readingsForDay(userId, date) {
  const { rows } = await query(
    `SELECT id, slot, value FROM readings
     WHERE user_id = $1 AND reading_date = $2
     ORDER BY array_position($3::text[], slot)`,
    [userId, date, SLOT_KEYS],
  );
  return rows.map((row) => ({ ...row, slotLabel: slotLabel(row.slot) }));
}

async function getReports(userId, date) {
  const ranges = reportRanges(date);
  const [daily, readings, monthToDate, monthly] = await Promise.all([
    summarize(userId, ranges.daily),
    readingsForDay(userId, date),
    summarize(userId, ranges.monthToDate),
    summarize(userId, ranges.monthly),
  ]);
  return { date, daily: { ...daily, readings }, monthToDate, monthly };
}

module.exports = { getReports };
