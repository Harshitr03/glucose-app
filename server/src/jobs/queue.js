const { Queue } = require('bullmq');
const config = require('../config');

const QUEUE_NAME = 'reminders';
const DAILY_JOB = 'daily-reminders';

function redisConnection() {
  if (!config.redisUrl) throw new Error('REDIS_URL is required for background jobs (see server/.env.example)');
  const url = new URL(config.redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port) || 6379,
    db: Number(url.pathname.slice(1)) || 0,
    username: url.username || undefined,
    password: url.password || undefined,
    // BullMQ's workers block on Redis and must retry forever rather than give up after N attempts.
    maxRetriesPerRequest: null,
  };
}

function createQueue() {
  return new Queue(QUEUE_NAME, { connection: redisConnection() });
}

module.exports = { QUEUE_NAME, DAILY_JOB, redisConnection, createQueue };
