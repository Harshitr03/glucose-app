const HttpError = require('../utils/httpError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['patient', 'doctor'];
const MIN_PASSWORD_LENGTH = 8;

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateEmail(body) {
  const email = asTrimmedString(body.email).toLowerCase();
  if (!email) throw new HttpError(400, 'Please enter your email.', 'email');
  if (!EMAIL_PATTERN.test(email)) throw new HttpError(400, 'Please enter a valid email.', 'email');
  return email;
}

function validateRegister(body = {}) {
  const name = asTrimmedString(body.name);
  if (!name) throw new HttpError(400, 'Please enter your name.', 'name');
  if (name.length > 100) throw new HttpError(400, 'Name must be 100 characters or fewer.', 'name');

  const email = validateEmail(body);

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 'password');
  }

  const role = body.role === undefined ? 'patient' : body.role;
  if (!ROLES.includes(role)) throw new HttpError(400, 'Role must be patient or doctor.', 'role');

  return { name, email, password, role };
}

function validateLogin(body = {}) {
  const email = validateEmail(body);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) throw new HttpError(400, 'Please enter your password.', 'password');
  return { email, password };
}

module.exports = { validateRegister, validateLogin };
