const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateNoteBody } = require('../validation/notes');
const { parseId } = require('../validation/common');
const careTeam = require('../services/careTeamService');
const noteService = require('../services/noteService');

const router = express.Router();
const doctorOnly = [requireAuth, requireRole('doctor')];

router.get('/notes', requireAuth, async (req, res) => {
  if (req.user.role === 'patient') {
    return res.json({ notes: await noteService.listNotesForPatient(req.user.id) });
  }
  const patientId = parseId(req.query.patientId, 'Patient');
  await careTeam.assertCanViewPatient(req.user.id, patientId);
  return res.json({ notes: await noteService.listNotesForPatient(patientId, { doctorId: req.user.id }) });
});

router.post('/notes', doctorOnly, async (req, res) => {
  const patientId = parseId(req.body?.patientId, 'Patient');
  const body = validateNoteBody(req.body);
  await careTeam.assertCanViewPatient(req.user.id, patientId);
  const note = await noteService.createNote(req.user.id, patientId, body);
  res.status(201).json({ note });
});

router.put('/note', doctorOnly, async (req, res) => {
  const id = parseId(req.query.id, 'Note');
  const note = await noteService.updateNote(req.user.id, id, validateNoteBody(req.body));
  res.json({ note });
});

router.delete('/note', doctorOnly, async (req, res) => {
  await noteService.deleteNote(req.user.id, parseId(req.query.id, 'Note'));
  res.status(204).end();
});

module.exports = router;
