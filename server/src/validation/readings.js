const HttpError = require('../utils/httpError');
const { SLOT_KEYS } = require('../constants/slots');
const { isValidIsoDate, todayIso } = require('../utils/dates');

const MIN_VALUE = 40;
const MAX_VALUE = 600;
const MAX_PAGE_LIMIT = 100;

function parseValue(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    throw new HttpError(400, 'Please enter a glucose value.', 'value');
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < MIN_VALUE || value > MAX_VALUE) {
    throw new HttpError(400, `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`, 'value');
  }
  return value;
}

function parseDate(raw, field = 'date') {
  if (!raw) throw new HttpError(400, 'Please choose a date.', field);
  if (!isValidIsoDate(raw)) throw new HttpError(400, 'Date must be in YYYY-MM-DD format.', field);
  return raw;
}

function validateReading(body = {}) {
  const value = parseValue(body.value);

  const date = parseDate(body.date);
  if (date > todayIso()) throw new HttpError(400, 'Date cannot be in the future.', 'date');

  if (!SLOT_KEYS.includes(body.slot)) throw new HttpError(400, 'Please choose a time slot.', 'slot');

  return { date, slot: body.slot, value };
}

function parsePositiveInt(raw, fallback, field) {
  if (raw === undefined) return fallback;
  const number = Number(raw);
  if (!Number.isInteger(number) || number < 1) {
    throw new HttpError(400, `${field} must be a positive whole number.`, field);
  }
  return number;
}

function validateListQuery(query = {}) {
  const from = query.from === undefined ? undefined : parseDate(query.from, 'from');
  const to = query.to === undefined ? undefined : parseDate(query.to, 'to');
  if (from && to && from > to) throw new HttpError(400, '"from" must be on or before "to".', 'from');

  const page = parsePositiveInt(query.page, 1, 'page');
  const limit = Math.min(parsePositiveInt(query.limit, 20, 'limit'), MAX_PAGE_LIMIT);

  return { from, to, page, limit };
}

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Reading not found.');
  return id;
}

module.exports = { validateReading, validateListQuery, parseId };
