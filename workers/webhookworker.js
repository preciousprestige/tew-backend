// workers/webhookWorker.js
const { Worker, Queue } = require("bullmq");
const IORedis = require("ioredis");
const { verifyPaystackPayment } = require("../controllers/paystackController");

// ✅ Redis connection
const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379");

// ✅ Export the queue (so we can add jobs from controllers)
const webhookQueue = new Queue("webhookQueue", { connection });

// ✅ Worker to process jobs
const webhookWorker = new Worker(
  "webhookQueue",
  async (job) => {
    console.log(`Processing webhook retry job: ${job.id}`);
    const { reference } = job.data;

    // Re-run verification safely
    await verifyPaystackPayment(
      { body: { reference } },
      {
        status: () => ({
          json: (data) => console.log("Retry result:", data),
        }),
      }
    );
  },
  { connection }
);

webhookWorker.on("completed", (job) => {
  console.log(`✅ Webhook retry succeeded for job ${job.id}`);
});

webhookWorker.on("failed", (job, err) => {
  console.error(`❌ Webhook retry failed for job ${job.id}`, err);
});

module.exports = { webhookQueue, webhookWorker };
