// utils/publish-event.js
const { Kafka } = require("kafkajs");

const [, , topic, eventJson] = process.argv;

if (!topic || !eventJson) {
  console.error("Usage: node publish-event.js <topic> <json>");
  process.exit(1);
}

const kafka = new Kafka({
  clientId: "jenkins-publisher",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"], // ✅ Dynamic!
});

const producer = kafka.producer();

async function publish() {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: eventJson }],
  });
  await producer.disconnect();
  console.log(`📨 Published to ${topic}: ${eventJson}`);
}

publish().catch((err) => {
  console.error("Kafka publish failed (non-fatal):", err.message);
  process.exit(0); // exit 0 so pipeline doesn't fail on Kafka issues
});
