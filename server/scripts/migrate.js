const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db/pool');

async function migrate() {
  const schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
}

if (require.main === module) {
  migrate()
    .then(() => console.log('Database schema is up to date.'))
    .catch((err) => {
      console.error('Migration failed:', err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

module.exports = { migrate };
