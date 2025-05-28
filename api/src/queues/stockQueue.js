require('dotenv').config({ path: '../../../.env' });
const { Queue, QueueEvents } = require('bullmq');

const stockQueueConfig = {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 500,
    removeOnFail: 1000,
  }
};

const stocksQueue = new Queue('stocks estimation', stockQueueConfig);
const stockQueueEvents = new QueueEvents('stocks estimation', stockQueueConfig);

module.exports = { stocksQueue, stockQueueEvents };