const { pool } = require('../../src/db/pool');

async function resetDb() {
  await pool.query('TRUNCATE users, readings, doctor_patients, doctor_notes RESTART IDENTITY CASCADE');
}

async function closeDb() {
  await pool.end();
}

module.exports = { resetDb, closeDb };
