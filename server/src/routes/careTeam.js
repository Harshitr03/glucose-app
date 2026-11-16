const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateEmail } = require('../validation/auth');
const { validateListQuery } = require('../validation/readings');
const { validateReportDate } = require('../validation/reports');
const { parseId } = require('../validation/common');
const careTeam = require('../services/careTeamService');
const readingService = require('../services/readingService');
const reportService = require('../services/reportService');

const router = express.Router();
const doctorOnly = [requireAuth, requireRole('doctor')];
const patientOnly = [requireAuth, requireRole('patient')];

router.get('/patients', doctorOnly, async (req, res) => {
  res.json({ patients: await careTeam.listPatients(req.user.id) });
});

router.post('/patients', doctorOnly, async (req, res) => {
  const email = validateEmail(req.body ?? {});
  const patient = await careTeam.invitePatient(req.user.id, email);
  res.status(201).json({ patient });
});

router.delete('/patient', doctorOnly, async (req, res) => {
  const patientId = parseId(req.query.id, 'Patient');
  await careTeam.removeLink(req.user.id, patientId, 'Patient not found.');
  res.status(204).end();
});

router.get('/patient/reports', doctorOnly, async (req, res) => {
  const patientId = parseId(req.query.id, 'Patient');
  await careTeam.assertCanViewPatient(req.user.id, patientId);
  const date = validateReportDate(req.query.date);
  res.json(await reportService.getReports(patientId, date));
});

router.get('/patient/readings', doctorOnly, async (req, res) => {
  const patientId = parseId(req.query.id, 'Patient');
  await careTeam.assertCanViewPatient(req.user.id, patientId);
  const { id, ...filters } = req.query;
  res.json(await readingService.listReadings(patientId, validateListQuery(filters)));
});

router.get('/doctors', patientOnly, async (req, res) => {
  res.json({ doctors: await careTeam.listDoctors(req.user.id) });
});

router.post('/doctor/accept', patientOnly, async (req, res) => {
  await careTeam.acceptInvite(req.user.id, parseId(req.query.id, 'Doctor'));
  res.status(204).end();
});

router.delete('/doctor', patientOnly, async (req, res) => {
  const doctorId = parseId(req.query.id, 'Doctor');
  await careTeam.removeLink(doctorId, req.user.id, 'Doctor not found.');
  res.status(204).end();
});

module.exports = router;
