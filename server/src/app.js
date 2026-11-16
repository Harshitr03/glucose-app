const express = require('express');
const cors = require('cors');
const config = require('./config');
const { query } = require('./db/pool');

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/api/health', async (req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Express only treats this as an error handler because it takes 4 arguments; keep `next`.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

module.exports = app;
