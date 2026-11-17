const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db/pool');
const { logDailyReminders } = require('../src/jobs/dailyReminders');
const { todayIso, shiftIsoDay } = require('../src/utils/dates');
const { resetDb, closeDb } = require('./helpers/db');
const { createUser } = require('./helpers/users');

const today = todayIso();
const yesterday = shiftIsoDay(today, -1);
let patient;

function getReminder(auth = patient.auth) {
  return request(app).get('/api/reminder').set('Authorization', auth);
}

function addReading(date, slot) {
  return request(app).post('/api/readings').set('Authorization', patient.auth).send({ date, slot, value: 120 });
}

beforeEach(async () => {
  await resetDb();
  patient = await createUser();
});
afterAll(closeDb);

test('returns null when nothing was logged', async () => {
  const res = await getReminder();
  expect(res.body).toEqual({ reminder: null });
});

test('returns yesterday’s reminder with the missing slots', async () => {
  await addReading(yesterday, 'after_lunch');
  await logDailyReminders(yesterday);

  const res = await getReminder();
  expect(res.body.reminder).toMatchObject({
    date: yesterday,
    missingSlots: ['morning_fasting', 'after_breakfast', 'after_dinner'],
  });
});

test('shrinks as missed readings are logged and disappears when all are in', async () => {
  await addReading(yesterday, 'morning_fasting');
  await addReading(yesterday, 'after_breakfast');
  await logDailyReminders(yesterday);

  await addReading(yesterday, 'after_lunch');
  expect((await getReminder()).body.reminder.missingSlots).toEqual(['after_dinner']);

  await addReading(yesterday, 'after_dinner');
  expect((await getReminder()).body.reminder).toBeNull();
});

test('prefers today’s reminder over yesterday’s', async () => {
  await logDailyReminders(yesterday);
  await logDailyReminders(today);
  expect((await getReminder()).body.reminder.date).toBe(today);
});

test('ignores reminders older than yesterday', async () => {
  await logDailyReminders(shiftIsoDay(today, -2));
  expect((await getReminder()).body.reminder).toBeNull();
});

test('dismissing hides the reminder', async () => {
  await logDailyReminders(yesterday);
  const { id } = (await getReminder()).body.reminder;

  const res = await request(app).post(`/api/reminder/dismiss?id=${id}`).set('Authorization', patient.auth);

  expect(res.status).toBe(204);
  expect((await getReminder()).body.reminder).toBeNull();
});

test('cannot dismiss someone else’s reminder', async () => {
  await logDailyReminders(yesterday);
  const { rows } = await pool.query('SELECT id FROM reminder_logs');
  const other = await createUser();

  const res = await request(app).post(`/api/reminder/dismiss?id=${rows[0].id}`).set('Authorization', other.auth);
  expect(res.status).toBe(404);
});

test('is patient-only', async () => {
  const doctor = await createUser({ role: 'doctor' });
  expect((await getReminder(doctor.auth)).status).toBe(403);
});
