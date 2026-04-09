// ============================================================
// 📊 JENKINS BUILD MONITOR - Real-time via Kafka
// ============================================================

import { Kafka } from "kafkajs";
import chalk from "chalk";

const kafka = new Kafka({
  clientId: "jenkins-monitor",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "jenkins-monitor-group" });

interface BuildState {
  buildNumber: string;
  status: string;
  stage: string;
  startTime: Date;
}

const activeBuilds = new Map<string, BuildState>();

async function startMonitoring() {
  await consumer.connect();
  await consumer.subscribe({
    topics: ["jenkins-events", "build-events", "deployment-events"],
    fromBeginning: false,
  });

  console.log(chalk.green.bold("🎯 Jenkins Build Monitor Started\n"));
  console.log(chalk.gray("─".repeat(60)));

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const event = JSON.parse(message.value!.toString());
      handleEvent(topic, event);
    },
  });
}

function handleEvent(topic: string, event: any) {
  const time = new Date().toLocaleTimeString();
  const buildKey = `${event.jobName}-${event.buildNumber}`;

  switch (event.type) {
    case "BUILD_STARTED":
      activeBuilds.set(buildKey, {
        buildNumber: event.buildNumber,
        status: "running",
        stage: "checkout",
        startTime: new Date(),
      });
      console.log(
        chalk.blue(`\n🔨 [${time}] Build #${event.buildNumber} started`),
      );
      console.log(chalk.gray(`   Branch: ${event.branch}`));
      console.log(chalk.gray(`   Commit: ${event.commit?.substring(0, 7)}`));
      break;

    case "CHECKOUT_COMPLETE":
      console.log(chalk.green(`✓ [${time}] Checkout complete`));
      break;

    case "INSTALL_STARTED":
      console.log(chalk.yellow(`⏳ [${time}] Installing dependencies...`));
      break;

    case "INSTALL_COMPLETE":
      console.log(chalk.green(`✓ [${time}] Dependencies installed`));
      break;

    case "TESTS_STARTED":
      console.log(chalk.yellow(`🧪 [${time}] Running tests...`));
      break;

    case "TESTS_PASSED":
      console.log(
        chalk.green(
          `✅ [${time}] Tests passed (${event.testsPassed}/${event.testsRun})`,
        ),
      );
      break;

    case "TESTS_FAILED":
      console.log(chalk.red(`❌ [${time}] Tests failed: ${event.error}`));
      break;

    case "REPORT_PUBLISHED":
      console.log(chalk.cyan(`📊 [${time}] Report: ${event.reportUrl}`));
      break;

    case "DEPLOYMENT_STARTED":
      console.log(
        chalk.magenta(`🚀 [${time}] Deploying to ${event.environment}...`),
      );
      break;

    case "DEPLOYMENT_COMPLETE":
      console.log(chalk.green(`✓ [${time}] Deployed to ${event.environment}`));
      break;

    case "BUILD_SUCCESS":
      const build = activeBuilds.get(buildKey);
      console.log(
        chalk.green.bold(`\n✅ Build #${event.buildNumber} SUCCEEDED`),
      );
      console.log(chalk.gray(`   Duration: ${event.duration}`));
      console.log(chalk.gray("─".repeat(60)));
      activeBuilds.delete(buildKey);
      break;

    case "BUILD_FAILED":
      console.log(chalk.red.bold(`\n❌ Build #${event.buildNumber} FAILED`));
      console.log(chalk.gray("─".repeat(60)));
      activeBuilds.delete(buildKey);
      break;
  }
}

// Start monitoring
startMonitoring().catch(console.error);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n🛑 Shutting down monitor...");
  await consumer.disconnect();
  process.exit(0);
});
