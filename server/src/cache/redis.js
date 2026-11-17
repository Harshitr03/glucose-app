const { Redis } = require('ioredis');
const config = require('../config');

let client = null;
let warned = false;
let connectedBefore = false;
const reconnectHandlers = [];

function getClient() {
  if (!config.redisUrl) return null;
  if (!client) {
    // Fail fast instead of queueing commands while Redis is down, so callers fall back to Postgres.
    client = new Redis(config.redisUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false });
    client.on('error', (err) => {
      if (!warned) console.warn(`Redis unavailable, caching disabled until it reconnects: ${err.message}`);
      warned = true;
    });
    client.on('ready', () => {
      warned = false;
      if (connectedBefore) reconnectHandlers.forEach((handler) => handler(client));
      connectedBefore = true;
    });
  }
  return client;
}

async function safely(command) {
  const redis = getClient();
  if (!redis || redis.status !== 'ready') return null;
  try {
    return await command(redis);
  } catch {
    return null;
  }
}

function onReconnect(handler) {
  reconnectHandlers.push(handler);
}

async function closeRedis() {
  if (client) await client.quit().catch(() => client.disconnect());
  client = null;
  connectedBefore = false;
}

module.exports = { getClient, safely, onReconnect, closeRedis };
