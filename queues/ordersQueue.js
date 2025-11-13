//const { Queue } = require("bullmq");
//const IORedis = require("ioredis");

// Redis connection
//const connection = new IORedis(process.env.REDIS_URL);

// Define orders queue
//const ordersQueue = new Queue("ordersQueue", {
  //connection,
  //defaultJobOptions: {
    //attempts: 5,
    //backoff: { type: "exponential", delay: 60000 },
   // removeOnComplete: true,
    //removeOnFail: false,
  //},
//});

//module.exports = ordersQueue;
