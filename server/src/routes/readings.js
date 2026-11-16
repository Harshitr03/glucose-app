const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateReading, validateListQuery, parseId } = require('../validation/readings');
const readingService = require('../services/readingService');

const router = express.Router();

router.use(requireAuth, requireRole('patient'));

router.get('/', async (req, res) => {
  const filters = validateListQuery(req.query);
  res.json(await readingService.listReadings(req.user.id, filters));
});

router.post('/', async (req, res) => {
  const input = validateReading(req.body);
  const reading = await readingService.createReading(req.user.id, input);
  res.status(201).json({ reading });
});

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  const input = validateReading(req.body);
  const reading = await readingService.updateReading(req.user.id, id, input);
  res.json({ reading });
});

router.delete('/:id', async (req, res) => {
  await readingService.deleteReading(req.user.id, parseId(req.params.id));
  res.status(204).end();
});

module.exports = router;
