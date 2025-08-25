const { Queue } = require("bullmq");
const { redisConnection } = require("../redisConnection");

// Payments Queue
const paymentsQueue = new Queue("paymentsQueue", { connection: redisConnection });

module.exports = { paymentsQueue };
