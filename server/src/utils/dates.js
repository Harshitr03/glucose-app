const config = require('../config');

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  // Rejects dates like 2026-02-30, which Date silently rolls over to March.
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayIso(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(now);
}

module.exports = { isValidIsoDate, todayIso };
