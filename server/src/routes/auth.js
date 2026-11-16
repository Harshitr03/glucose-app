const express = require('express');
const { validateRegister, validateLogin } = require('../validation/auth');
const authService = require('../services/authService');
const { requireAuth } = require('../middleware/auth');
const HttpError = require('../utils/httpError');

const router = express.Router();

router.post('/register', async (req, res) => {
  const input = validateRegister(req.body);
  const result = await authService.register(input);
  res.status(201).json(result);
});

router.post('/login', async (req, res) => {
  const input = validateLogin(req.body);
  const result = await authService.login(input);
  res.json(result);
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await authService.findUserById(req.user.id);
  if (!user) throw new HttpError(401, 'Please log in to continue.');
  res.json({ user });
});

module.exports = router;
