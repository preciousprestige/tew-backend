// workers/webhookWorker.js
const { Worker, Queue } = require("bullmq");
const { redisConnection } = require("../redisConnection");
const { verifyPaystackPayment } = require("../controllers/paystack.controller");

// ✅ Export the queue (so controllers can add jobs)
const webhookQueue = new Queue("webhookQueue", {
  connection: redisConnection,
});

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
  {
    connection: redisConnection,
  }
);

webhookWorker.on("completed", (job) => {
  console.log(`✅ Webhook retry succeeded for job ${job.id}`);
});

webhookWorker.on("failed", (job, err) => {
  console.error(`❌ Webhook retry failed for job ${job.id}`, err);
});

module.exports = { webhookQueue, webhookWorker };
