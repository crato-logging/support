const kafka = require("kafka-node");
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({ kafkaHost: "35.183.71.251:9092" });
const influx = require("./DB/influx.js");
const fs = require("fs");

const fetchReqPayload = [
  {
    topic: "jsonlogs",
    partition: 0
  }
];

const options = {
  fromOffset: "latest",
  encoding: "utf8"
};

const consumer = new Consumer(client, fetchReqPayload, [
  { autoCommit: false },
  options
]);

consumer.on("message", message => {
  const syslogMsg = message.value; // the rest is Kafka meta data
  const jsonMsg = JSON.parse(syslogMsg);

  writeToInfluxDB(jsonMsg);
});

consumer.on("error", err => console.log("error", err));
process.on("SIGINT", () => {
  consumer.close(true, () => process.exit());
});

// =========
influx
  .getDatabaseNames()
  .then(names => {
    if (!names.includes("LOG_DATA3")) {
      return influx.createDatabase("LOG_DATA3");
    }
  })
  .catch(error => console.log({ error }));

let count = 0;
const writeToInfluxDB = jsonMsg => {
  const time = jsonMsg.timestamp;
  const severity = jsonMsg.severity;
  const rawmsg = jsonMsg["raw-message"];
  const facility = jsonMsg.facility;
  const host = jsonMsg.host;
  let measurement_name = jsonMsg["syslog-tag"].slice(0, -1);

  if (severity === "err") {
    measurement_name = "error";
  }

  if (facility === "auth" || facility === "authpriv") {
    measurement_name = "authentication";
  }

  influx
    .writePoints(
      [
        {
          measurement: measurement_name,
          tags: { host: `${host}` },
          fields: {
            severity: severity,
            message: rawmsg,
            facility: facility,
            time: time,
            raw: JSON.stringify(jsonMsg) //a complete message for later analysis if needed
          }
        }
      ],
      {
        database: "LOG_DATA3"
      }
    )
    .then(() => {
      console.log("success");
      count += 1;
      console.log(count);
    })
    .catch(error => {
      console.error("Error saving data to db.");
    });
};
