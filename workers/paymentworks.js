// workers/paymentWorks.js
const { Worker } = require("bullmq");
const { redisConnection } = require("../redisConnection");

const paymentsWorker = new Worker(
  "paymentsQueue",
  async (job) => {
    console.log("📩 Processing payment job:", job.id, job.data);

    // example: verify Paystack or update DB
    // await verifyPaystackPayment(job.data);

    return { status: "success" };
  },
  { connection: redisConnection }
);

paymentsWorker.on("completed", (job) => {
  console.log(`✅ Payment job ${job.id} completed`);
});

paymentsWorker.on("failed", (job, err) => {
  console.error(`❌ Payment job ${job?.id} failed:`, err);
});

module.exports = paymentsWorker;
