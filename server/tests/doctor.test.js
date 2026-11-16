const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db/pool');
const { resetDb, closeDb } = require('./helpers/db');
const { createUser } = require('./helpers/users');

let doctor;
let patient;

const api = {
  get: (url, auth) => request(app).get(url).set('Authorization', auth),
  post: (url, auth, body) => request(app).post(url).set('Authorization', auth).send(body),
  put: (url, auth, body) => request(app).put(url).set('Authorization', auth).send(body),
  delete: (url, auth) => request(app).delete(url).set('Authorization', auth),
};

function invite(email = patient.user.email, auth = doctor.auth) {
  return api.post('/api/patients', auth, { email });
}

async function linkAccepted() {
  await invite();
  await api.post(`/api/doctor/accept?id=${doctor.user.id}`, patient.auth);
}

beforeEach(async () => {
  await resetDb();
  doctor = await createUser({ name: 'Dr Mehta', email: 'doc@example.com', role: 'doctor' });
  patient = await createUser({ name: 'Asha', email: 'asha@example.com' });
});
afterAll(closeDb);

describe('inviting a patient', () => {
  test('creates a pending link that both sides can see', async () => {
    const res = await invite();
    const patients = await api.get('/api/patients', doctor.auth);
    const doctors = await api.get('/api/doctors', patient.auth);

    expect(res.status).toBe(201);
    expect(patients.body.patients).toEqual([
      { id: patient.user.id, name: 'Asha', email: 'asha@example.com', status: 'pending', lastReadingDate: null, recentCount: null, recentInRange: null },
    ]);
    expect(doctors.body.doctors).toEqual([{ id: doctor.user.id, name: 'Dr Mehta', email: 'doc@example.com', status: 'pending' }]);
  });

  test.each([
    ['an unknown email', 'nobody@example.com', 404, 'No patient account uses this email.'],
    ['a doctor’s email', 'doc@example.com', 400, 'That account belongs to a doctor, not a patient.'],
  ])('rejects %s', async (_, email, status, error) => {
    const res = await invite(email);

    expect(res.status).toBe(status);
    expect(res.body.error).toBe(error);
  });

  test('rejects inviting the same patient twice', async () => {
    await invite();
    const res = await invite();
    expect(res.status).toBe(409);
  });

  test('patients cannot invite', async () => {
    const res = await invite(patient.user.email, patient.auth);
    expect(res.status).toBe(403);
  });
});

describe('viewing a patient', () => {
  beforeEach(async () => {
    await pool.query(
      "INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, '2026-10-15', 'after_lunch', 140)",
      [patient.user.id],
    );
  });

  test('is blocked while the invite is pending', async () => {
    await invite();
    const res = await api.get(`/api/patient/reports?id=${patient.user.id}&date=2026-10-15`, doctor.auth);
    expect(res.status).toBe(404);
  });

  test('works once the patient accepts', async () => {
    await linkAccepted();

    const reports = await api.get(`/api/patient/reports?id=${patient.user.id}&date=2026-10-15`, doctor.auth);
    const readings = await api.get(`/api/patient/readings?id=${patient.user.id}`, doctor.auth);

    expect(reports.body.daily).toMatchObject({ count: 1, highest: 140 });
    expect(readings.body.readings).toEqual([{ id: 1, date: '2026-10-15', slot: 'after_lunch', value: 140 }]);
  });

  test('is blocked for a doctor the patient never accepted', async () => {
    await linkAccepted();
    const otherDoctor = await createUser({ role: 'doctor' });

    const res = await api.get(`/api/patient/readings?id=${patient.user.id}`, otherDoctor.auth);
    expect(res.status).toBe(404);
  });

  test('stops after the patient removes the doctor', async () => {
    await linkAccepted();
    await api.delete(`/api/doctor?id=${doctor.user.id}`, patient.auth);

    const res = await api.get(`/api/patient/readings?id=${patient.user.id}`, doctor.auth);
    expect(res.status).toBe(404);
  });

  test('the patient list shows recent activity once the link is accepted', async () => {
    await linkAccepted();

    const res = await api.get('/api/patients', doctor.auth);

    expect(res.body.patients[0]).toMatchObject({ lastReadingDate: '2026-10-15' });
  });

  test('a doctor cannot change readings', async () => {
    await linkAccepted();
    const res = await api.put('/api/reading?id=1', doctor.auth, { date: '2026-10-15', slot: 'after_lunch', value: 90 });
    expect(res.status).toBe(403);
  });
});

describe('notes', () => {
  function addNote(body = 'Cut down on sugar after dinner.', auth = doctor.auth) {
    return api.post('/api/notes', auth, { patientId: patient.user.id, body });
  }

  test('a linked doctor writes a note and the patient sees it', async () => {
    await linkAccepted();

    const created = await addNote();
    const seen = await api.get('/api/notes', patient.auth);

    expect(created.status).toBe(201);
    expect(seen.body.notes).toEqual([
      expect.objectContaining({ doctorName: 'Dr Mehta', body: 'Cut down on sugar after dinner.' }),
    ]);
  });

  test('cannot be written without an accepted link', async () => {
    await invite();
    const res = await addNote();
    expect(res.status).toBe(404);
  });

  test('rejects an empty note', async () => {
    await linkAccepted();
    const res = await addNote('   ');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please write a note.');
  });

  test('a doctor edits and deletes only their own notes', async () => {
    await linkAccepted();
    const { body } = await addNote();
    const otherDoctor = await createUser({ role: 'doctor' });

    const otherEdit = await api.put(`/api/note?id=${body.note.id}`, otherDoctor.auth, { body: 'Hijacked' });
    const ownEdit = await api.put(`/api/note?id=${body.note.id}`, doctor.auth, { body: 'Walk 30 minutes daily.' });
    const otherDelete = await api.delete(`/api/note?id=${body.note.id}`, otherDoctor.auth);
    const ownDelete = await api.delete(`/api/note?id=${body.note.id}`, doctor.auth);

    expect(otherEdit.status).toBe(404);
    expect(ownEdit.body.note.body).toBe('Walk 30 minutes daily.');
    expect(otherDelete.status).toBe(404);
    expect(ownDelete.status).toBe(204);
  });
});
