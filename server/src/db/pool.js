const { Pool, types } = require('pg');
const config = require('../config');

// Keep DATE as "YYYY-MM-DD": pg's default JS Date can shift the day when serialized in non-UTC timezones.
const DATE_OID = 1082;
types.setTypeParser(DATE_OID, (value) => value);

const pool = new Pool({ connectionString: config.databaseUrl });

function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
