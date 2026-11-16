const bcrypt = require('bcrypt');
const { pool } = require('../src/db/pool');
const { migrate } = require('./migrate');
const { SLOT_KEYS } = require('../src/constants/slots');
const { todayIso } = require('../src/utils/dates');

const DEMO_PASSWORD = 'demo1234';
const DEMO_PATIENT = { name: 'Priya Sharma', email: 'demo.patient@sweety.test', role: 'patient' };
const DEMO_DOCTOR = { name: 'Dr Anil Kapoor', email: 'demo.doctor@sweety.test', role: 'doctor' };

const SLOT_BASELINES = {
  morning_fasting: 105,
  after_breakfast: 155,
  after_lunch: 165,
  after_dinner: 160,
};

// Fixed-seed random numbers so every run produces the same demo data.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function datesFrom(from, to) {
  const dates = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function firstOfPreviousMonth(today) {
  const [year, month] = today.split('-').map(Number);
  return new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
}

function buildReadings(today) {
  const random = createRandom(42);
  const readings = [];
  for (const date of datesFrom(firstOfPreviousMonth(today), today)) {
    for (const slot of SLOT_KEYS) {
      if (random() < 0.15) continue;
      const swing = Math.round((random() - 0.5) * 70);
      const value = Math.min(600, Math.max(40, SLOT_BASELINES[slot] + swing));
      readings.push({ date, slot, value });
    }
  }
  return readings;
}

async function insertUser(client, user, passwordHash) {
  const { rows } = await client.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [user.name, user.email, passwordHash, user.role],
  );
  return rows[0].id;
}

async function seed({ today = todayIso() } = {}) {
  await migrate();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const readings = buildReadings(today);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    // Only the two demo accounts are replaced; cascades remove their readings, link and notes.
    await client.query('DELETE FROM users WHERE email = ANY($1)', [[DEMO_PATIENT.email, DEMO_DOCTOR.email]]);

    const patientId = await insertUser(client, DEMO_PATIENT, passwordHash);
    const doctorId = await insertUser(client, DEMO_DOCTOR, passwordHash);

    await client.query(
      `INSERT INTO readings (user_id, reading_date, slot, value)
       SELECT $1, r.date, r.slot, r.value
       FROM json_to_recordset($2::json) AS r(date date, slot text, value int)`,
      [patientId, JSON.stringify(readings)],
    );

    await client.query(
      "INSERT INTO doctor_patients (doctor_id, patient_id, status) VALUES ($1, $2, 'accepted')",
      [doctorId, patientId],
    );

    await client.query(
      `INSERT INTO doctor_notes (doctor_id, patient_id, body) VALUES
         ($1, $2, 'Fasting readings are mostly in range. Keep taking metformin with breakfast.'),
         ($1, $2, 'After-lunch readings run high. Try a 15-minute walk after lunch and smaller rice portions.')`,
      [doctorId, patientId],
    );

    await client.query('COMMIT');
    return { patientId, doctorId, readingCount: readings.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed()
    .then(({ readingCount }) => {
      console.log(`Seeded ${readingCount} readings.`);
      console.log(`Patient: ${DEMO_PATIENT.email} / ${DEMO_PASSWORD}`);
      console.log(`Doctor:  ${DEMO_DOCTOR.email} / ${DEMO_PASSWORD}`);
    })
    .catch((err) => {
      console.error('Seeding failed:', err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { seed, DEMO_PATIENT, DEMO_DOCTOR, DEMO_PASSWORD };
