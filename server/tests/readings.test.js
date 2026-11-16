const request = require('supertest');
const app = require('../src/app');
const { todayIso } = require('../src/utils/dates');
const { resetDb, closeDb } = require('./helpers/db');
const { createUser } = require('./helpers/users');

const DATE = '2026-10-15';
const reading = { date: DATE, slot: 'after_lunch', value: 140 };

let patient;

function addReading(body, auth = patient.auth) {
  return request(app).post('/api/readings').set('Authorization', auth).send(body);
}

function tomorrow() {
  const date = new Date(`${todayIso()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

beforeEach(async () => {
  await resetDb();
  patient = await createUser();
});
afterAll(closeDb);

describe('POST /api/readings validation', () => {
  test('creates a valid reading', async () => {
    const res = await addReading(reading);

    expect(res.status).toBe(201);
    expect(res.body.reading).toEqual({ id: 1, ...reading });
  });

  test.each([
    ['missing value', { value: undefined }, 'Please enter a glucose value.'],
    ['empty value', { value: '' }, 'Please enter a glucose value.'],
    ['value below 40', { value: 39 }, 'Value must be between 40 and 600 mg/dl.'],
    ['value above 600', { value: 601 }, 'Value must be between 40 and 600 mg/dl.'],
    ['decimal value', { value: 120.5 }, 'Value must be between 40 and 600 mg/dl.'],
    ['future date', { date: tomorrow() }, 'Date cannot be in the future.'],
    ['impossible date', { date: '2026-02-30' }, 'Date must be in YYYY-MM-DD format.'],
    ['unknown slot', { slot: 'midnight' }, 'Please choose a time slot.'],
  ])('rejects %s', async (_, overrides, error) => {
    const res = await addReading({ ...reading, ...overrides });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(error);
  });

  test.each([40, 600])('accepts the boundary value %i', async (value) => {
    const res = await addReading({ ...reading, value });
    expect(res.status).toBe(201);
  });

  test('accepts today', async () => {
    const res = await addReading({ ...reading, date: todayIso() });
    expect(res.status).toBe(201);
  });
});

describe('daily limits', () => {
  test('rejects a second reading in the same slot on the same day', async () => {
    await addReading(reading);
    const res = await addReading({ ...reading, value: 150 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('allows the same slot on a different day', async () => {
    await addReading(reading);
    const res = await addReading({ ...reading, date: '2026-10-14' });
    expect(res.status).toBe(201);
  });

  test('rejects a fifth reading for the day', async () => {
    for (const slot of ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']) {
      await addReading({ ...reading, slot });
    }
    const res = await addReading(reading);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You can add only 4 readings per day.');
  });
});

describe('PUT /api/reading?id=', () => {
  test('can change the value while keeping the same slot', async () => {
    const { body } = await addReading(reading);

    const res = await request(app)
      .put(`/api/reading?id=${body.reading.id}`)
      .set('Authorization', patient.auth)
      .send({ ...reading, value: 155 });

    expect(res.status).toBe(200);
    expect(res.body.reading.value).toBe(155);
  });

  test('cannot move a reading into a slot that is already taken', async () => {
    await addReading({ ...reading, slot: 'after_dinner' });
    const { body } = await addReading(reading);

    const res = await request(app)
      .put(`/api/reading?id=${body.reading.id}`)
      .set('Authorization', patient.auth)
      .send({ ...reading, slot: 'after_dinner' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You already have an After dinner reading for this date.');
  });
});

describe('ownership', () => {
  test('a patient only sees and changes their own readings', async () => {
    const { body } = await addReading(reading);
    const other = await createUser();

    const list = await request(app).get('/api/readings').set('Authorization', other.auth);
    const edit = await request(app)
      .put(`/api/reading?id=${body.reading.id}`)
      .set('Authorization', other.auth)
      .send(reading);
    const remove = await request(app).delete(`/api/reading?id=${body.reading.id}`).set('Authorization', other.auth);

    expect(list.body.readings).toEqual([]);
    expect(edit.status).toBe(404);
    expect(remove.status).toBe(404);
  });

  test('doctors cannot use the readings API', async () => {
    const doctor = await createUser({ role: 'doctor' });
    const res = await addReading(reading, doctor.auth);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/readings', () => {
  test('filters by date range, sorts by date then slot, and paginates', async () => {
    await addReading({ date: '2026-10-14', slot: 'after_dinner', value: 100 });
    await addReading({ date: '2026-10-15', slot: 'after_dinner', value: 110 });
    await addReading({ date: '2026-10-15', slot: 'morning_fasting', value: 120 });
    await addReading({ date: '2026-10-01', slot: 'after_lunch', value: 130 });

    const res = await request(app)
      .get('/api/readings?from=2026-10-14&to=2026-10-15&page=1&limit=2')
      .set('Authorization', patient.auth);

    expect(res.body.total).toBe(3);
    expect(res.body.readings.map((r) => [r.date, r.slot])).toEqual([
      ['2026-10-15', 'morning_fasting'],
      ['2026-10-15', 'after_dinner'],
    ]);
  });
});

describe('DELETE /api/reading?id=', () => {
  test('deletes the reading', async () => {
    const { body } = await addReading(reading);

    const res = await request(app).delete(`/api/reading?id=${body.reading.id}`).set('Authorization', patient.auth);
    const list = await request(app).get('/api/readings').set('Authorization', patient.auth);

    expect(res.status).toBe(204);
    expect(list.body.total).toBe(0);
  });
});

describe('id query parameter', () => {
  test.each([
    ['missing', '/api/reading', 400],
    ['not a number', '/api/reading?id=abc', 404],
  ])('handles an id that is %s', async (_, url, status) => {
    const res = await request(app).delete(url).set('Authorization', patient.auth);
    expect(res.status).toBe(status);
  });
});
