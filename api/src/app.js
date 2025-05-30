require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const { produceEstimation, getJobStatus } = require('./services/estimationService');

const corsOptions = {
  origin: '*',
  allowHeaders: [
    'Access-Control-Allow-Headers',
    'Origin',
    'Accept',
    'X-Requested-With',
    'Content-Type',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Auth',
  ],
  allowMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'DELETE', 'PATCH'],
};

const app = express();
app.use(express.json());
app.use(cors(corsOptions));


app.post('/job', produceEstimation);

app.get('/job/:id', getJobStatus);

/// https://worker.stoksforall.me/heartbeat
app.get('/heartbeat', (req, res) => {
  res.send({status: true});
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Master API running on port ${PORT}`);
});