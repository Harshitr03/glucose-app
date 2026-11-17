const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db/pool');
const { getClient } = require('../src/cache/redis');
const { resetDb, closeDb } = require('./helpers/db');
const { createUser } = require('./helpers/users');

const DATE = '2026-10-15';
let patient;

function getReports(date = DATE) {
  return request(app).get(`/api/reports?date=${date}`).set('Authorization', patient.auth);
}

function addReading(body) {
  return request(app).post('/api/readings').set('Authorization', patient.auth).send(body);
}

function insertBehindTheApi(slot, value) {
  return pool.query('INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)', [
    patient.user.id,
    DATE,
    slot,
    value,
  ]);
}

beforeEach(async () => {
  await resetDb();
  patient = await createUser();
});
afterAll(closeDb);

test('serves a repeated report from the cache', async () => {
  await addReading({ date: DATE, slot: 'after_lunch', value: 140 });
  await getReports();
  await insertBehindTheApi('after_dinner', 200);

  const res = await getReports();
  expect(res.body.daily.count).toBe(1);
});

test('stores the report with a TTL', async () => {
  await getReports();
  const keys = await getClient().keys('reports:*:v*');
  expect(keys).toHaveLength(1);
  expect(await getClient().ttl(keys[0])).toBeGreaterThan(0);
});

test.each([
  ['adding', async () => addReading({ date: DATE, slot: 'after_dinner', value: 200 })],
  [
    'editing',
    async (id) =>
      request(app)
        .put(`/api/reading?id=${id}`)
        .set('Authorization', patient.auth)
        .send({ date: DATE, slot: 'after_lunch', value: 200 }),
  ],
  ['deleting', async (id) => request(app).delete(`/api/reading?id=${id}`).set('Authorization', patient.auth)],
])('%s a reading clears the cached report', async (_, change) => {
  const created = await addReading({ date: DATE, slot: 'after_lunch', value: 140 });
  const before = await getReports();

  await change(created.body.reading.id);
  const after = await getReports();

  expect(after.body.daily).not.toEqual(before.body.daily);
});

test('a reading change also refreshes later days in the month', async () => {
  await getReports('2026-10-20');
  await addReading({ date: DATE, slot: 'after_lunch', value: 140 });

  const res = await getReports('2026-10-20');
  expect(res.body.monthToDate.count).toBe(1);
});

test('one user changing readings leaves another user cached', async () => {
  const other = await createUser({ email: 'other@example.com' });
  await request(app).get(`/api/reports?date=${DATE}`).set('Authorization', other.auth);
  await addReading({ date: DATE, slot: 'after_lunch', value: 140 });

  expect(await getClient().get(`reports:${other.user.id}:version`)).toBeNull();
  expect(await getClient().get(`reports:${patient.user.id}:version`)).toBe('1');
});
