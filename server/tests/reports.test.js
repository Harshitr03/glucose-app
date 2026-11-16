const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db/pool');
const { reportRanges } = require('../src/utils/dates');
const { resetDb, closeDb } = require('./helpers/db');
const { createUser } = require('./helpers/users');

describe('reportRanges', () => {
  test('matches the example in the brief (15 Oct 2026)', () => {
    expect(reportRanges('2026-10-15')).toEqual({
      daily: { from: '2026-10-15', to: '2026-10-15' },
      monthToDate: { from: '2026-10-01', to: '2026-10-15' },
      monthly: { from: '2026-09-01', to: '2026-09-30' },
    });
  });

  test('January looks back to December of the previous year', () => {
    expect(reportRanges('2026-01-10').monthly).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });

  test('March in a leap year looks back to 29 February', () => {
    expect(reportRanges('2028-03-05').monthly).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
});

describe('GET /api/reports', () => {
  let patient;

  async function insertReadings(userId, rows) {
    for (const [date, slot, value] of rows) {
      await pool.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
        [userId, date, slot, value],
      );
    }
  }

  function getReports(date, auth = patient.auth) {
    return request(app).get(`/api/reports?date=${date}`).set('Authorization', auth);
  }

  beforeEach(async () => {
    await resetDb();
    patient = await createUser();
  });
  afterAll(closeDb);

  test('computes daily, month-to-date and previous-month stats', async () => {
    await insertReadings(patient.user.id, [
      ['2026-10-15', 'after_lunch', 101],
      ['2026-10-15', 'morning_fasting', 100],
      ['2026-10-15', 'after_dinner', 100],
      ['2026-10-02', 'after_lunch', 250],
      ['2026-10-16', 'after_lunch', 300],
      ['2026-09-01', 'after_lunch', 80],
      ['2026-09-30', 'after_lunch', 90],
      ['2026-08-31', 'after_lunch', 500],
    ]);

    const res = await getReports('2026-10-15');

    expect(res.status).toBe(200);
    expect(res.body.daily).toEqual({
      from: '2026-10-15',
      to: '2026-10-15',
      count: 3,
      highest: 101,
      lowest: 100,
      average: 100.3,
      inRange: 3,
      readings: [
        { id: 2, slot: 'morning_fasting', slotLabel: 'Morning (fasting)', value: 100 },
        { id: 1, slot: 'after_lunch', slotLabel: 'After lunch', value: 101 },
        { id: 3, slot: 'after_dinner', slotLabel: 'After dinner', value: 100 },
      ],
    });
    expect(res.body.monthToDate).toMatchObject({ count: 4, highest: 250, lowest: 100, average: 137.8, inRange: 3 });
    expect(res.body.monthly).toMatchObject({ from: '2026-09-01', to: '2026-09-30', count: 2, average: 85 });
  });

  test('returns empty stats when there are no readings', async () => {
    const res = await getReports('2026-10-15');

    expect(res.body.daily).toMatchObject({ count: 0, highest: null, lowest: null, average: null, inRange: 0, readings: [] });
    expect(res.body.monthly.count).toBe(0);
  });

  test('only includes the logged-in patient’s readings', async () => {
    const other = await createUser();
    await insertReadings(other.user.id, [['2026-10-15', 'after_lunch', 400]]);

    const res = await getReports('2026-10-15');
    expect(res.body.daily.count).toBe(0);
  });

  test('rejects a future date', async () => {
    const res = await getReports('2999-01-01');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Date cannot be in the future.');
  });
});
