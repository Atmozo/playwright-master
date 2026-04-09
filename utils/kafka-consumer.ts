// ============================================================
// 📊 KAFKA CONSUMER - Real-time Test Monitor
// ============================================================
import { kafkaHelper } from "./kafka-helper";

// Suppress noisy KafkaJS timeout warnings
process.on("warning", (warning) => {
  if (warning.name === "TimeoutNegativeWarning") return;
  console.warn(warning);
});

async function startMonitoring() {
  console.log("🎯 Starting Kafka test monitor...\n");

  await kafkaHelper.consumeMessages(
    "test-monitor-group",
    ["test-events", "test-results", "test-metrics"],
    async ({ topic, partition, message }) => {
      if (!message.value) return;

      let event: any;
      try {
        event = JSON.parse(message.value.toString());
      } catch (e) {
        console.warn(
          `⚠️ Skipping invalid message on ${topic}:`,
          message.value.toString(),
        );
        return;
      }

      switch (topic) {
        case "test-events":
          handleTestEvent(event);
          break;
        case "test-results":
          handleTestResult(event);
          break;
        case "test-metrics":
          handleMetric(event);
          break;
      }
    },
  );
}

function handleTestEvent(event: any) {
  const timestamp = new Date(event.timestamp).toLocaleTimeString();

  if (event.type === "TEST_START") {
    console.log(`🧪 [${timestamp}] Test started: ${event.testName}`);
  } else if (event.type === "USER_ACTION") {
    console.log(
      `👆 [${timestamp}] User action: ${event.action} on ${event.element}`,
    );
  } else if (event.type === "FORM_FILLED") {
    console.log(`📝 [${timestamp}] Form filled: ${event.form}`);
  }
}

function handleTestResult(event: any) {
  const timestamp = new Date(event.timestamp).toLocaleTimeString();
  const emoji = event.result === "passed" ? "✅" : "❌";

  if (event.type === "TEST_END") {
    console.log(
      `${emoji} [${timestamp}] Test ${event.result}: ${event.testName} (${event.duration}ms)`,
    );
  } else if (event.type === "API_TEST") {
    console.log(
      `📡 [${timestamp}] API test: ${event.endpoint} - Status: ${event.status}`,
    );
  }
}

function handleMetric(event: any) {
  const timestamp = new Date(event.timestamp).toLocaleTimeString();

  if (event.type === "PAGE_LOAD") {
    console.log(
      `⚡ [${timestamp}] Page load: ${event.url} - ${event.duration}ms`,
    );
  }
}

// Start monitoring, then block forever
startMonitoring()
  .then(() => new Promise(() => {}))
  .catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n🛑 Shutting down monitor...");
  await kafkaHelper.disconnect();
  process.exit(0);
});
