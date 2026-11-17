const { once } = require('events');
const { pool } = require('../../src/db/pool');
const { getClient, closeRedis } = require('../../src/cache/redis');

async function resetDb() {
  await pool.query('TRUNCATE users, readings, doctor_patients, doctor_notes, reminder_logs RESTART IDENTITY CASCADE');
  const redis = getClient();
  if (redis) {
    if (redis.status !== 'ready') await once(redis, 'ready');
    await redis.flushdb();
  }
}

async function closeDb() {
  await Promise.all([pool.end(), closeRedis()]);
}

module.exports = { resetDb, closeDb };
