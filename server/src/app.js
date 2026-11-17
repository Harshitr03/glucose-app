const express = require('express');
const cors = require('cors');
const config = require('./config');
const { query } = require('./db/pool');
const HttpError = require('./utils/httpError');
const authRoutes = require('./routes/auth');
const readingRoutes = require('./routes/readings');
const reportRoutes = require('./routes/reports');
const careTeamRoutes = require('./routes/careTeam');
const noteRoutes = require('./routes/notes');
const reminderRoutes = require('./routes/reminders');

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api', readingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', careTeamRoutes);
app.use('/api', noteRoutes);
app.use('/api', reminderRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Express only treats this as an error handler because it takes 4 arguments; keep `next`.
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, field: err.field });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (!config.isTest) console.error(err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;
