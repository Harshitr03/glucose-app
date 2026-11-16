const { query } = require('../db/pool');
const HttpError = require('../utils/httpError');

async function invitePatient(doctorId, email) {
  const { rows } = await query('SELECT id, name, email, role FROM users WHERE email = $1', [email]);
  const patient = rows[0];
  if (!patient) throw new HttpError(404, 'No patient account uses this email.', 'email');
  if (patient.role !== 'patient') throw new HttpError(400, 'That account belongs to a doctor, not a patient.', 'email');

  const inserted = await query(
    `INSERT INTO doctor_patients (doctor_id, patient_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING status`,
    [doctorId, patient.id],
  );
  if (inserted.rowCount === 0) throw new HttpError(409, 'This patient is already invited or on your list.', 'email');

  return { id: patient.id, name: patient.name, email: patient.email, status: inserted.rows[0].status };
}

async function listPatients(doctorId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, dp.status
     FROM doctor_patients dp JOIN users u ON u.id = dp.patient_id
     WHERE dp.doctor_id = $1
     ORDER BY dp.status, u.name`,
    [doctorId],
  );
  return rows;
}

async function listDoctors(patientId) {
  const { rows } = await query(
    `SELECT u.id, u.name, u.email, dp.status
     FROM doctor_patients dp JOIN users u ON u.id = dp.doctor_id
     WHERE dp.patient_id = $1
     ORDER BY dp.status DESC, u.name`,
    [patientId],
  );
  return rows;
}

async function acceptInvite(patientId, doctorId) {
  const { rowCount } = await query(
    `UPDATE doctor_patients SET status = 'accepted'
     WHERE doctor_id = $1 AND patient_id = $2 AND status = 'pending'`,
    [doctorId, patientId],
  );
  if (rowCount === 0) throw new HttpError(404, 'Invitation not found.');
}

async function removeLink(doctorId, patientId, notFoundMessage) {
  const { rowCount } = await query(
    'DELETE FROM doctor_patients WHERE doctor_id = $1 AND patient_id = $2',
    [doctorId, patientId],
  );
  if (rowCount === 0) throw new HttpError(404, notFoundMessage);
}

// Unlinked and pending patients get the same 404 as unknown ids, so doctors can't probe who exists.
async function assertCanViewPatient(doctorId, patientId) {
  const { rowCount } = await query(
    `SELECT 1 FROM doctor_patients
     WHERE doctor_id = $1 AND patient_id = $2 AND status = 'accepted'`,
    [doctorId, patientId],
  );
  if (rowCount === 0) throw new HttpError(404, 'Patient not found.');
}

module.exports = {
  invitePatient,
  listPatients,
  listDoctors,
  acceptInvite,
  removeLink,
  assertCanViewPatient,
};
