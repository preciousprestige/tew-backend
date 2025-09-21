// workers/ordersWorker.js
const { Worker } = require("bullmq");
const { redisConnection } = require("../redisConnection");

const ordersWorker = new Worker(
  "ordersQueue",
  async (job) => {
    console.log("📦 Processing order job:", job.id, job.data);

    // example: handle order DB update, stock decrement, email sending, etc.
    // await processOrder(job.data);

    return { status: "success" };
  },
  { connection: redisConnection }
);

ordersWorker.on("completed", (job) => {
  console.log(`✅ Order job ${job.id} completed`);
});

ordersWorker.on("failed", (job, err) => {
  console.error(`❌ Order job ${job?.id} failed:`, err);
});

module.exports = ordersWorker;
