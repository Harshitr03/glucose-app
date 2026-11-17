const { createQueue, DAILY_JOB } = require('../src/jobs/queue');

async function main() {
  const date = process.argv[2];
  const queue = createQueue();
  const job = await queue.add(DAILY_JOB, date ? { date } : {}, { attempts: 3 });
  console.log(`Queued ${DAILY_JOB} job ${job.id}${date ? ` for ${date}` : ''}. The worker will pick it up.`);
  await queue.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
