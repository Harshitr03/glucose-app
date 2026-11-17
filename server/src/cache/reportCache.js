const config = require('../config');
const { safely, onReconnect } = require('./redis');

// One reading can change many cached reports (its day, later days that month, next month's
// "previous month"), so writes bump a per-user version instead of hunting down keys.
const versionKey = (userId) => `reports:${userId}:version`;

async function reportKey(userId, date) {
  const version = (await safely((redis) => redis.get(versionKey(userId)))) ?? '0';
  return `reports:${userId}:v${version}:${date}`;
}

async function getCachedReport(userId, date) {
  const key = await reportKey(userId, date);
  const cached = await safely((redis) => redis.get(key));
  return cached ? { key, report: JSON.parse(cached) } : { key, report: null };
}

function cacheReport(key, report) {
  return safely((redis) => redis.set(key, JSON.stringify(report), 'EX', config.reportCacheTtl));
}

function invalidateReports(userId) {
  return safely((redis) => redis.incr(versionKey(userId)));
}

async function clearAllReports(redis) {
  try {
    for await (const keys of redis.scanStream({ match: 'reports:*', count: 500 })) {
      if (keys.length) await redis.unlink(...keys);
    }
  } catch (err) {
    console.warn(`Could not clear cached reports after reconnecting: ${err.message}`);
  }
}

// Writes made while Redis was unreachable couldn't bump versions, so anything cached may be stale.
onReconnect(clearAllReports);

module.exports = { getCachedReport, cacheReport, invalidateReports };
