var kafka = require('kafka-node');
var Consumer = kafka.Consumer;
var client = new kafka.KafkaClient( {kafkaHost: 'localhost:9092' });

var topics = [ { topic: 'jsonlogs' } ];
var options = {
	autoCommit: true,
	fetchMaxWaitMs: 1000,
	fetchMaxBytes: 1024 * 1024,
	encoding: 'utf8',
};

var consumer = new Consumer(client, topics, options);

consumer.on('message', function(message) {
	console.log(message);
});

consumer.on('error', function(err) {
	console.log('error', err);
});

process.on('SIGINT', function() {
	consumer.close(true, function() {
		process.exit();
	});
});

