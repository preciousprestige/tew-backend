//const { Queue } = require("bullmq");
//const IORedis = require("ioredis");

// Redis connection
//const connection = new IORedis(process.env.REDIS_URL);

// Define payments queue
//const paymentsQueue = new Queue("paymentsQueue", {
  //connection,
  //defaultJobOptions: {
    //attempts: 5,
    //backoff: { type: "exponential", delay: 60000 }, // 1 min retry
    //removeOnComplete: true,
    //removeOnFail: false,
  //},
//});

//module.exports = paymentsQueue;
