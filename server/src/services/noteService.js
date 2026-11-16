const { query } = require('../db/pool');
const HttpError = require('../utils/httpError');

const NOTE_COLUMNS = `n.id, n.patient_id AS "patientId", n.doctor_id AS "doctorId", d.name AS "doctorName",
  n.body, n.created_at AS "createdAt", n.updated_at AS "updatedAt"`;

async function findNote(id) {
  const { rows } = await query(
    `SELECT ${NOTE_COLUMNS} FROM doctor_notes n JOIN users d ON d.id = n.doctor_id WHERE n.id = $1`,
    [id],
  );
  return rows[0];
}

async function listNotesForPatient(patientId, { doctorId } = {}) {
  const { rows } = await query(
    `SELECT ${NOTE_COLUMNS} FROM doctor_notes n JOIN users d ON d.id = n.doctor_id
     WHERE n.patient_id = $1 AND ($2::int IS NULL OR n.doctor_id = $2)
     ORDER BY n.created_at DESC`,
    [patientId, doctorId ?? null],
  );
  return rows;
}

async function createNote(doctorId, patientId, body) {
  const { rows } = await query(
    'INSERT INTO doctor_notes (doctor_id, patient_id, body) VALUES ($1, $2, $3) RETURNING id',
    [doctorId, patientId, body],
  );
  return findNote(rows[0].id);
}

async function updateNote(doctorId, id, body) {
  const { rowCount } = await query(
    'UPDATE doctor_notes SET body = $3, updated_at = now() WHERE id = $1 AND doctor_id = $2',
    [id, doctorId, body],
  );
  if (rowCount === 0) throw new HttpError(404, 'Note not found.');
  return findNote(id);
}

async function deleteNote(doctorId, id) {
  const { rowCount } = await query('DELETE FROM doctor_notes WHERE id = $1 AND doctor_id = $2', [id, doctorId]);
  if (rowCount === 0) throw new HttpError(404, 'Note not found.');
}

module.exports = { listNotesForPatient, createNote, updateNote, deleteNote };
