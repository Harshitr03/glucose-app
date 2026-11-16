const HttpError = require('../utils/httpError');

const MAX_NOTE_LENGTH = 2000;

function validateNoteBody(body = {}) {
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!text) throw new HttpError(400, 'Please write a note.', 'body');
  if (text.length > MAX_NOTE_LENGTH) {
    throw new HttpError(400, `Note must be ${MAX_NOTE_LENGTH} characters or fewer.`, 'body');
  }
  return text;
}

module.exports = { validateNoteBody };
