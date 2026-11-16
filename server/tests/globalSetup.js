module.exports = async () => {
  process.env.NODE_ENV = 'test';
  const { migrate } = require('../scripts/migrate');
  const { pool } = require('../src/db/pool');
  await migrate();
  await pool.end();
};
