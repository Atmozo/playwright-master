// ============================================================
// 📢 KAFKA TO SLACK - Send build notifications to Slack
// ============================================================

import { Kafka } from "kafkajs";
import axios from "axios";

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

const kafka = new Kafka({
  clientId: "slack-notifier",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "slack-notifier-group" });

async function sendSlackNotification(message: any) {
  if (!SLACK_WEBHOOK) {
    console.log("⚠️  SLACK_WEBHOOK_URL not set");
    return;
  }

  try {
    await axios.post(SLACK_WEBHOOK, message);
    console.log("✅ Slack notification sent");
  } catch (error) {
    console.error("❌ Failed to send Slack notification:", error);
  }
}

async function startSlackNotifier() {
  await consumer.connect();
  await consumer.subscribe({
    topics: ["build-events", "deployment-events"],
    fromBeginning: false,
  });

  console.log("🔔 Slack notifier started");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value!.toString());

      switch (event.type) {
        case "BUILD_SUCCESS":
          await sendSlackNotification({
            text: `✅ Build #${event.buildNumber} succeeded`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*✅ Build Successful*\n\nBuild #${event.buildNumber} completed in ${event.duration}`,
                },
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: { type: "plain_text", text: "View Build" },
                    url: event.buildUrl,
                  },
                ],
              },
            ],
          });
          break;

        case "BUILD_FAILED":
          await sendSlackNotification({
            text: `❌ Build #${event.buildNumber} failed`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*❌ Build Failed*\n\nBuild #${event.buildNumber} failed`,
                },
              },
            ],
          });
          break;

        case "DEPLOYMENT_COMPLETE":
          await sendSlackNotification({
            text: `🚀 Deployed to ${event.environment}`,
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*🚀 Deployment Complete*\n\nDeployed version ${event.deployedVersion} to ${event.environment}`,
                },
              },
            ],
          });
          break;
      }
    },
  });
}

startSlackNotifier().catch(console.error);

process.on("SIGINT", async () => {
  await consumer.disconnect();
  process.exit(0);
});
