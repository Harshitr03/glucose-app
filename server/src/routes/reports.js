const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateReportDate } = require('../validation/reports');
const reportService = require('../services/reportService');

const router = express.Router();

router.get('/', requireAuth, requireRole('patient'), async (req, res) => {
  const date = validateReportDate(req.query.date);
  res.json(await reportService.getReports(req.user.id, date));
});

module.exports = router;
