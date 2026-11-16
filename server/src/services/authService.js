const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../db/pool');
const HttpError = require('../utils/httpError');

const BCRYPT_ROUNDS = 10;
const UNIQUE_VIOLATION = '23505';

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

function signToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

async function register({ name, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, role],
    );
    const user = toPublicUser(rows[0]);
    return { user, token: signToken(user) };
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      throw new HttpError(409, 'An account with this email already exists.', 'email');
    }
    throw err;
  }
}

async function login({ email, password }) {
  const { rows } = await query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [email],
  );
  const row = rows[0];
  // Same message for unknown email and wrong password, so emails can't be probed.
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw new HttpError(401, 'Invalid email or password.');
  }
  const user = toPublicUser(row);
  return { user, token: signToken(user) };
}

async function findUserById(id) {
  const { rows } = await query('SELECT id, name, email, role FROM users WHERE id = $1', [id]);
  return rows[0] ? toPublicUser(rows[0]) : null;
}

module.exports = { register, login, findUserById };
