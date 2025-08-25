const { Queue } = require("bullmq");
const { redisConnection } = require("../redisConnection"); // central redis config

// Orders Queue
const ordersQueue = new Queue("ordersQueue", { connection: redisConnection });

module.exports = { ordersQueue };
