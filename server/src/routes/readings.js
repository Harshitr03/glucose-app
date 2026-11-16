const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateReading, validateListQuery } = require('../validation/readings');
const { parseId } = require('../validation/common');
const readingService = require('../services/readingService');

const router = express.Router();
const patientOnly = [requireAuth, requireRole('patient')];

router.get('/readings', patientOnly, async (req, res) => {
  const filters = validateListQuery(req.query);
  res.json(await readingService.listReadings(req.user.id, filters));
});

router.post('/readings', patientOnly, async (req, res) => {
  const input = validateReading(req.body);
  const reading = await readingService.createReading(req.user.id, input);
  res.status(201).json({ reading });
});

router.put('/reading', patientOnly, async (req, res) => {
  const id = parseId(req.query.id);
  const input = validateReading(req.body);
  const reading = await readingService.updateReading(req.user.id, id, input);
  res.json({ reading });
});

router.delete('/reading', patientOnly, async (req, res) => {
  await readingService.deleteReading(req.user.id, parseId(req.query.id));
  res.status(204).end();
});

module.exports = router;
