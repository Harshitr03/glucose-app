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

function toIso(year, monthIndex, day) {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
}

function shiftIsoDay(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function reportRanges(date) {
  const [year, month] = date.split('-').map(Number);
  const monthIndex = month - 1;
  return {
    daily: { from: date, to: date },
    monthToDate: { from: toIso(year, monthIndex, 1), to: date },
    // Day 0 of a month is the last day of the month before it.
    monthly: { from: toIso(year, monthIndex - 1, 1), to: toIso(year, monthIndex, 0) },
  };
}

module.exports = { isValidIsoDate, todayIso, shiftIsoDay, reportRanges };
