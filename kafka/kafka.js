// kafka.js
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "freshers-job-app",
  brokers: [process.env.KAFKA_BROKER],  // Confluent Cloud broker
  ssl: true,
  sasl: {
    mechanism: "plain",
    username: process.env.KAFKA_API_KEY,
    password: process.env.KAFKA_API_SECRET,
  },
});

module.exports = kafka;
