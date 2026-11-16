const request = require('supertest');
const app = require('../../src/app');

async function createUser({ name = 'Test User', email, role = 'patient' } = {}) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email: email ?? `${role}${Date.now()}${Math.random()}@example.com`, password: 'secret123', role });
  return { user: res.body.user, auth: `Bearer ${res.body.token}` };
}

module.exports = { createUser };
