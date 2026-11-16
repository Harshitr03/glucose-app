const HttpError = require('../utils/httpError');
const { isValidIsoDate, todayIso } = require('../utils/dates');

function validateReportDate(raw) {
  const today = todayIso();
  if (raw === undefined || raw === '') return today;
  if (!isValidIsoDate(raw)) throw new HttpError(400, 'Date must be in YYYY-MM-DD format.', 'date');
  if (raw > today) throw new HttpError(400, 'Date cannot be in the future.', 'date');
  return raw;
}

module.exports = { validateReportDate };
