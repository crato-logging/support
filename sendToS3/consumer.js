const kafka = require("kafka-node");
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ kafkaHost: "35.183.71.251:9092" });
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const config = require("./config.js");

const fs = require("fs");

aws.config.update({
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  accessKeyId: config.AWS_ACCESS_KEY_ID
});

const s3 = new aws.S3();

const fetchReqPayload = [
  {
    topic: "jsonlogs",
    offset: 0,
    partition: 0
  }
];

const options = {
  autoCommit: true,
  autoCommitIntervalMs: 5000,
  fetchMaxWaitMs: 100,
  fetchMinBytes: 1,
  fetchMaxBytes: 1024 * 1024,
  encoding: "utf8"
};

const consumer = new Consumer(client, fetchReqPayload, options);

let size = 0;
let max = 50;

consumer.on("message", message => {
  console.log(message);
  console.log(size);
  const jsonString = JSON.stringify(message);

  fs.appendFile("./log_data.json", jsonString + "\n", err => {
    if (err) {
      console.log("Error writing file", err);
    } else {
      console.log("Success");
    }
  });
  size += 1;

  if (size >= 50) {
    sendToS3();
  }
});

consumer.on("error", err => console.log("error", err));
process.on("SIGINT", () => {
  consumer.close(true, () => process.exit());
});

// =========

const sendToS3 = () => {
  fs.readFile("log_data.json", (err, data) => {
    if (err) {
      console.log(err);
    }

    const params = {
      Bucket: "node-to-s3-test",
      Key: "logs.json", //Date.now().toString() + "_logs.json",
      Body: JSON.stringify(data, null, "\n")
    };

    s3.upload(params, (s3Err, data) => {
      if (s3Err) throw s3Err;

      console.log("Uploaded successfully");
    });
  });
};
