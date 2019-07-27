const kafka = require('kafka-node');
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient( {kafkaHost: 'localhost:9092' });

const fetchReqPayload = [
  {
    topic: 'jsonlogs',
    offset: 0,
    partition: 0,
  }
];

const options = {
  autoCommit: true,
  autoCommitIntervalMs: 5000,
  fetchMaxWaitMs: 100,
  fetchMinBytes: 1,
  fetchMaxBytes: 1024 * 1024,
  encoding: 'utf8',
};

const consumer = new Consumer(client, fetchReqPayload, options);

consumer.on('message', message => console.log(message));
consumer.on('error', err => console.log('error', err));
process.on('SIGINT', () => {
  consumer.close(true, () => process.exit());
});
