const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db/pool');
const { requireRole } = require('../src/middleware/auth');
const { resetDb, closeDb } = require('./helpers/db');

const validUser = { name: 'Asha Patel', email: 'Asha@Example.com', password: 'secret123' };

function register(overrides = {}) {
  return request(app).post('/api/auth/register').send({ ...validUser, ...overrides });
}

beforeEach(resetDb);
afterAll(closeDb);

describe('POST /api/auth/register', () => {
  test('creates a patient, lowercases the email and returns a token', async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: 1, name: 'Asha Patel', email: 'asha@example.com', role: 'patient' });
  });

  test('stores a bcrypt hash, never the plain password', async () => {
    await register();

    const { rows } = await pool.query('SELECT password_hash FROM users');
    expect(rows[0].password_hash).not.toBe(validUser.password);
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/);
  });

  test('can register a doctor', async () => {
    const res = await register({ role: 'doctor' });
    expect(res.body.user.role).toBe('doctor');
  });

  test('rejects a duplicate email regardless of case', async () => {
    await register();
    const res = await register({ email: 'asha@EXAMPLE.com' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'An account with this email already exists.', field: 'email' });
  });

  test.each([
    [{ name: '  ' }, 'name', 'Please enter your name.'],
    [{ email: 'not-an-email' }, 'email', 'Please enter a valid email.'],
    [{ password: 'short' }, 'password', 'Password must be at least 8 characters.'],
    [{ role: 'admin' }, 'role', 'Role must be patient or doctor.'],
  ])('rejects invalid input %o', async (overrides, field, error) => {
    const res = await register(overrides);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error, field });
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => register());

  test('logs in with the right password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('asha@example.com');
    expect(res.body.token).toEqual(expect.any(String));
  });

  test.each([
    ['wrong password', { email: 'asha@example.com', password: 'wrongpass' }],
    ['unknown email', { email: 'nobody@example.com', password: 'secret123' }],
  ])('gives the same error for %s', async (_, credentials) => {
    const res = await request(app).post('/api/auth/login').send(credentials);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });
});

describe('GET /api/auth/me', () => {
  test('returns the logged-in user', async () => {
    const { body } = await register();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('asha@example.com');
  });

  test.each([
    ['no token', undefined],
    ['a bad token', 'Bearer not.a.token'],
  ])('rejects %s', async (_, header) => {
    const req = request(app).get('/api/auth/me');
    if (header) req.set('Authorization', header);

    const res = await req;
    expect(res.status).toBe(401);
  });
});

describe('requireRole', () => {
  test.each([
    ['doctor', undefined],
    ['patient', 403],
  ])('a %s hitting a doctor-only route', (role, expectedStatus) => {
    const next = jest.fn();
    requireRole('doctor')({ user: { id: 1, role } }, {}, next);

    const err = next.mock.calls[0][0];
    expect(err?.status).toBe(expectedStatus);
  });
});
