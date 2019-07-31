const Influx = require("influx");

const kafka = require("kafka-node");
const Consumer = kafka.Consumer;
const kClient = new kafka.KafkaClient({ kafkaHost: "35.183.71.251:9092" });

const config = require("./config.js");

const fs = require("fs");

const fetchReqPayload = [
  {
    topic: "jsonlogs",
    offset: 0,
    partition: 0
  }
];

const options = {
  autoCommit: true,
  fromOffset: "latest",
  autoCommitIntervalMs: 5000,
  fetchMaxWaitMs: 100,
  fetchMinBytes: 1,
  fetchMaxBytes: 1024 * 1024,
  encoding: "utf8"
};

const consumer = new Consumer(kClient, fetchReqPayload, options);

consumer.on("message", message => {
  const syslogMsg = message.value;
  console.log(syslogMsg);

  writeToInfluxDB(syslogMsg);
});

consumer.on("error", err => console.log("error", err));
process.on("SIGINT", () => {
  consumer.close(true, () => process.exit());
});

// =========

const influx = new Influx.InfluxDB({
  database: "LOG_DATA",
  host: "35.183.71.251",
  port: 8086,
  username: config.INFLUX_DB_USERNAME,
  password: config.INFLUX_DB_PASSWORD,
  schema: [
    {
      measurement: "log_data",
      fields: {
        timestamp: Influx.FieldType.STRING,
        msg: Influx.FieldType.STRING,
        host: Influx.FieldType.STRING,
        severity: Influx.FieldType.STRING
      },
      tags: ["logtype"]
    }
  ]
});

const writeToInfluxDB = syslogMsg => {
  influx
    .writePoints(
      [
        {
          measurement: "log_data",
          tags: { logtype: "apache" },
          fields: {
            timestamp: "2013-43-43 14:34:34:00",
            msg: syslogMsg,
            host: "localhost",
            severity: "info"
          }
        }
      ],
      {
        database: "LOG_DATA"
      }
    )
    .then(() => {
      console.log("success");
    })
    .catch(error => {
      console.error("Error saving data to db.");
    });
};
