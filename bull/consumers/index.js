const { Worker, Job } = require('bullmq');
const axios = require('axios');
require('dotenv').config();
const { calculateProjections } = require('./functions');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
};

const worker = new Worker('stocks estimation', async (job) => {
  job.log(`[${process.env.WORKER_ID}] Processing job ${job.id}`);
  console.log(`[${process.env.WORKER_ID}] Processing job ${job.id}`);

  const { userId, token } = job.data;

  try {
    const boughtStocks = await axios.get(`${process.env.URL_API}/boughtStocks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const { linearProjections, linearRegressions } = await calculateProjections(boughtStocks.data);
    const linearProjection = linearProjections.reduce((sum, p) => sum + p.totalGain, 0);
    const linearRegression = linearRegressions.reduce((sum, p) => sum + p.totalGain, 0);

    job.log(`[${process.env.WORKER_ID}] Job ${job.id} completed successfully`);
    
    return {
      timestamp: new Date().toISOString(),
      status: "OK",
      reason: "Proyección calculada exitosamente",
      projections: {
        linearProjections,
        linearRegressions
      },
      totalProjections: {
        linearProjection,
        linearRegression
      },
      processedBy: process.env.WORKER_ID  
    };

  } catch (error) {
    job.log(`[${process.env.WORKER_ID}] Error in job ${job.id}: ${error.message}`);
    console.error(`[${process.env.WORKER_ID}] Error:`, error);
    throw error;
  }
}, { 
  connection,
  concurrency: 5,
  limiter: {
    max: 10,  
    duration: 1000
  }
});

// Callback on completed jobs
worker.on('completed', (job, returnvalue) => {
  job.log(`Worker completed job ${job.id} with result ${JSON.stringify(returnvalue)}`);
});

// Callback on failed jobs
worker.on('failed', (job, error) => {
  job.log(`Worker completed job ${job.id} with error ${error}`);
  // Do something with the return value.
});

// Callback on error of the worker
worker.on('error', (err) => {
  // log the error
  console.error(err);
});

// To handle gracefull shutdown of consummers
async function shutdown() {
  console.log('Received SIGTERM signal. Gracefully shutting down...');

  // Perform cleanup or shutdown operations here
  await worker.close();
  // Once cleanup is complete, exit the process
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);