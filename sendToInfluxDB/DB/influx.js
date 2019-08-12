const Influx = require("influx");
const config = require("./config.js");

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

module.exports = influx;
