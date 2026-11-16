const jwt = require('jsonwebtoken');
const config = require('../config');
const HttpError = require('../utils/httpError');

function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Please log in to continue.'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch {
    return next(new HttpError(401, 'Your session has expired. Please log in again.'));
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return next(new HttpError(403, 'You do not have access to this page.'));
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
