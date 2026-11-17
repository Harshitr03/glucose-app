const { Worker } = require('bullmq');
const config = require('./config');
const { pool } = require('./db/pool');
const { QUEUE_NAME, DAILY_JOB, redisConnection, createQueue } = require('./jobs/queue');
const { logDailyReminders } = require('./jobs/dailyReminders');

async function start() {
  const queue = createQueue();
  // Upserting by a fixed id means restarts or several workers keep exactly one daily schedule.
  await queue.upsertJobScheduler(
    DAILY_JOB,
    { pattern: config.reminderCron, tz: config.timezone },
    { name: DAILY_JOB, opts: { attempts: 3, backoff: { type: 'exponential', delay: 60_000 } } },
  );

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name !== DAILY_JOB) throw new Error(`Unknown job: ${job.name}`);
      const result = await logDailyReminders(job.data?.date);
      return { date: result.date, logged: result.logged.length };
    },
    { connection: redisConnection() },
  );

  worker.on('completed', (job, result) => {
    console.log(`Reminders for ${result.date}: logged ${result.logged} patient(s)`);
  });
  worker.on('failed', (job, err) => {
    console.error(`Reminder job failed (attempt ${job?.attemptsMade}): ${err.message}`);
  });

  console.log(`Reminder worker running; daily job at "${config.reminderCron}" (${config.timezone})`);

  async function shutdown() {
    await worker.close();
    await queue.close();
    await pool.end();
    process.exit(0);
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('Worker failed to start:', err.message);
  process.exit(1);
});
