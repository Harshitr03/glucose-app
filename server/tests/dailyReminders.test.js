const { pool } = require('../src/db/pool');
const { logDailyReminders } = require('../src/jobs/dailyReminders');
const { resetDb, closeDb } = require('./helpers/db');
const { createUser } = require('./helpers/users');

const DATE = '2026-10-15';

function addReadings(userId, slots, date = DATE) {
  return Promise.all(
    slots.map((slot) =>
      pool.query('INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, 120)', [userId, date, slot]),
    ),
  );
}

beforeEach(resetDb);
afterAll(closeDb);

test('logs patients with fewer than 4 readings, listing the missing slots in order', async () => {
  const patient = await createUser();
  await addReadings(patient.user.id, ['after_lunch', 'morning_fasting']);

  const { logged } = await logDailyReminders(DATE);

  expect(logged).toEqual([
    { userId: patient.user.id, readingsCount: 2, missingSlots: ['after_breakfast', 'after_dinner'] },
  ]);
});

test('includes patients with no readings at all', async () => {
  const patient = await createUser();
  const { logged } = await logDailyReminders(DATE);
  expect(logged).toEqual([
    {
      userId: patient.user.id,
      readingsCount: 0,
      missingSlots: ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'],
    },
  ]);
});

test('skips patients who logged all 4 readings', async () => {
  const patient = await createUser();
  await addReadings(patient.user.id, ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']);

  const { logged } = await logDailyReminders(DATE);
  expect(logged).toEqual([]);
});

test('skips doctors', async () => {
  await createUser({ role: 'doctor' });
  const { logged } = await logDailyReminders(DATE);
  expect(logged).toEqual([]);
});

test('only counts readings on that date', async () => {
  const patient = await createUser();
  await addReadings(patient.user.id, ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'], '2026-10-14');

  const { logged } = await logDailyReminders(DATE);
  expect(logged[0].readingsCount).toBe(0);
});

test('running twice for the same day logs each patient once', async () => {
  await createUser();
  await logDailyReminders(DATE);
  const second = await logDailyReminders(DATE);

  const { rows } = await pool.query('SELECT count(*)::int AS total FROM reminder_logs');
  expect(second.logged).toEqual([]);
  expect(rows[0].total).toBe(1);
});
