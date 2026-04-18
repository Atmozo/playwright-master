// utils/kafka-consumer.ts
// Real-time Kafka event monitor with colored output

import { Kafka, Consumer, EachMessagePayload } from "kafkajs";

// Get Kafka broker from environment or use container name
const KAFKA_BROKER = process.env.KAFKA_BROKER || "kafka:9093";

const kafka = new Kafka({
  clientId: "kafka-monitor",
  brokers: [KAFKA_BROKER],
});

const consumer: Consumer = kafka.consumer({
  groupId: "monitor-group",
});

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

async function monitorKafka() {
  try {
    console.log(
      colorize(`\n🔍 Connecting to Kafka at ${KAFKA_BROKER}...`, "cyan"),
    );

    await consumer.connect();
    console.log(colorize("✅ Connected to Kafka\n", "green"));

    // Subscribe to all test-related topics
    const topics = [
      "test-events",
      "test-results",
      "test-metrics",
      "jenkins-events",
      "build-events",
      "deployment-events",
    ];

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(colorize(`📡 Subscribed to ${topic}`, "blue"));
    }

    console.log(colorize("\n🎧 Listening for events...\n", "yellow"));

    await consumer.run({
      eachMessage: async ({
        topic,
        partition,
        message,
      }: EachMessagePayload) => {
        const value = message.value?.toString();
        if (!value) return;

        try {
          const event = JSON.parse(value);
          const timestamp = new Date().toISOString();

          // Color-code by topic
          let topicColor: keyof typeof colors = "cyan";
          if (topic.includes("jenkins")) topicColor = "magenta";
          else if (topic.includes("test")) topicColor = "green";
          else if (topic.includes("build")) topicColor = "yellow";
          else if (topic.includes("deployment")) topicColor = "blue";

          console.log(
            colorize(`[${timestamp}]`, "bright"),
            colorize(`[${topic}]`, topicColor),
            colorize(`[partition ${partition}]`, "cyan"),
          );

          // Pretty print the event
          console.log(JSON.stringify(event, null, 2));
          console.log(colorize("─".repeat(80), "cyan"));
        } catch (error) {
          console.error(
            colorize(`❌ Failed to parse message: ${error}`, "red"),
          );
        }
      },
    });
  } catch (error) {
    console.error(colorize(`\n❌ Kafka monitor error: ${error}\n`, "red"));
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log(colorize("\n\n🛑 Shutting down Kafka monitor...", "yellow"));
  await consumer.disconnect();
  console.log(colorize("✅ Disconnected from Kafka\n", "green"));
  process.exit(0);
});

monitorKafka();
