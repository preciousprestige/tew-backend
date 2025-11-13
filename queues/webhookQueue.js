// queues/webhookQueue.js
//const { Queue } = require("bullmq");
//const IORedis = require("ioredis");

// Redis connection
//const connection = new IORedis(process.env.REDIS_URL);

// Define queue
//const webhookQueue = new Queue("webhookQueue", {
  //connection,
  //defaultJobOptions: {
   // attempts: 5, // retry up to 5 times
    //backoff: {
     // type: "exponential",
      //delay: 60 * 1000, // start at 1 min
  //  },
   // removeOnComplete: true,
    //removeOnFail: false,
 // },
//});

//module.exports = webhookQueue;
