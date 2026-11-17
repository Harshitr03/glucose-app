const { pool } = require('../src/db/pool');
const { migrate } = require('./migrate');
const { seed, DEMO_PATIENT, DEMO_DOCTOR, DEMO_PASSWORD } = require('./seed');

async function setup() {
  await migrate();
  const { rows } = await pool.query('SELECT EXISTS (SELECT 1 FROM users) AS "hasUsers"');
  if (rows[0].hasUsers) {
    console.log('Database is up to date; existing data kept.');
    return;
  }
  const { readingCount } = await seed();
  console.log(`Empty database: seeded ${readingCount} demo readings.`);
  console.log(`Patient: ${DEMO_PATIENT.email} / ${DEMO_PASSWORD}`);
  console.log(`Doctor:  ${DEMO_DOCTOR.email} / ${DEMO_PASSWORD}`);
}

setup()
  .catch((err) => {
    console.error('Database setup failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
