const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { parseId } = require('../validation/common');
const reminderService = require('../services/reminderService');

const router = express.Router();
const patientOnly = [requireAuth, requireRole('patient')];

router.get('/reminder', patientOnly, async (req, res) => {
  res.json({ reminder: await reminderService.currentReminder(req.user.id) });
});

router.post('/reminder/dismiss', patientOnly, async (req, res) => {
  await reminderService.dismissReminder(req.user.id, parseId(req.query.id, 'Reminder'));
  res.status(204).end();
});

module.exports = router;
