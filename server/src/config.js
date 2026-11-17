const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const isTest = process.env.NODE_ENV === 'test';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (see server/.env.example)`);
  }
  return value;
}

const config = {
  isTest,
  port: Number(process.env.PORT) || 4000,
  databaseUrl: isTest ? required('TEST_DATABASE_URL') : required('DATABASE_URL'),
  redisUrl: (isTest ? process.env.TEST_REDIS_URL : process.env.REDIS_URL) || null,
  reportCacheTtl: Number(process.env.REPORT_CACHE_TTL_SECONDS) || 3600,
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

module.exports = config;
