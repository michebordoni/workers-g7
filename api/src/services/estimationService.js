const { stocksQueue, stockQueueEvents } = require('../queues/stockQueue');

exports.produceEstimation= async (req, res) => {
  try {
    const job = await stocksQueue.add('stocks estimation', {
      userId: req.body.userId, 
    });
    const completedJob = await job.waitUntilFinished(stockQueueEvents);
    res.status(201).send(JSON.stringify(completedJob));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.getJobStatus = async (req, res) => {
  try {
    const job = await stocksQueue.getJob(req.params.id);
    if (job) {
      const state = await job.getState();
      const progress = await job.progress();
      res.send({ id: job.id, state, progress });
    } else {
      res.status(404).send({ error: 'Job not found' });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};