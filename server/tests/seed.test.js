const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db/pool');
const { seed, DEMO_PATIENT, DEMO_DOCTOR, DEMO_PASSWORD } = require('../scripts/seed');
const { resetDb, closeDb } = require('./helpers/db');

const TODAY = '2026-11-17';

beforeEach(resetDb);
afterAll(closeDb);

test('creates readings that follow every validation rule', async () => {
  const { patientId, readingCount } = await seed({ today: TODAY });

  const { rows } = await pool.query(
    `SELECT min(reading_date)::text AS first, max(reading_date)::text AS last,
            min(value) AS lowest, max(value) AS highest,
            max(per_day) AS most_per_day, count(*)::int AS total
     FROM readings,
          LATERAL (SELECT count(*) AS per_day FROM readings r2
                   WHERE r2.user_id = readings.user_id AND r2.reading_date = readings.reading_date) d
     WHERE user_id = $1`,
    [patientId],
  );

  expect(rows[0]).toMatchObject({ first: '2026-10-01', last: TODAY, total: readingCount });
  expect(rows[0].lowest).toBeGreaterThanOrEqual(40);
  expect(rows[0].highest).toBeLessThanOrEqual(600);
  expect(Number(rows[0].most_per_day)).toBeLessThanOrEqual(4);
});

test('demo accounts can log in and the doctor can see the patient', async () => {
  await seed({ today: TODAY });

  const login = (email) => request(app).post('/api/auth/login').send({ email, password: DEMO_PASSWORD });
  const doctor = await login(DEMO_DOCTOR.email);
  const patient = await login(DEMO_PATIENT.email);

  const patients = await request(app).get('/api/patients').set('Authorization', `Bearer ${doctor.body.token}`);

  expect(patient.status).toBe(200);
  expect(patients.body.patients).toEqual([expect.objectContaining({ email: DEMO_PATIENT.email, status: 'accepted' })]);
});

test('running it twice replaces the demo data instead of duplicating it', async () => {
  const first = await seed({ today: TODAY });
  const second = await seed({ today: TODAY });

  const { rows } = await pool.query('SELECT count(*)::int AS users FROM users');
  const readings = await pool.query('SELECT count(*)::int AS total FROM readings');

  expect(rows[0].users).toBe(2);
  expect(readings.rows[0].total).toBe(second.readingCount);
  expect(second.readingCount).toBe(first.readingCount);
});
