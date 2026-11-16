const HttpError = require('../utils/httpError');

function parseId(raw, label = 'Reading') {
  if (raw === undefined || raw === '') throw new HttpError(400, `${label} id is required.`, 'id');
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, `${label} not found.`);
  return id;
}

module.exports = { parseId };
