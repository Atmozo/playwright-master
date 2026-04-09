// ============================================================
// 📨 KAFKA HELPER FOR PLAYWRIGHT TESTS
// ============================================================

import { Kafka, Producer, Consumer, EachMessagePayload } from "kafkajs";

export class KafkaHelper {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();

  constructor() {
    this.kafka = new Kafka({
      clientId: "playwright-tests",
      brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
      enforceRequestTimeout: false,
    });
  }

  // ══════════════════════════════════════════════════════════
  // PRODUCER: Send events to Kafka
  // ══════════════════════════════════════════════════════════

  async initProducer(): Promise<void> {
    if (!this.producer) {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        transactionTimeout: 30000,
      });
      await this.producer.connect();
      console.log("✅ Kafka producer connected");
    }
  }

  async publishEvent(topic: string, event: any): Promise<void> {
    if (!this.producer) {
      await this.initProducer();
    }

    await this.producer!.send({
      topic,
      messages: [
        {
          key: event.id || Date.now().toString(),
          value: JSON.stringify(event),
          timestamp: Date.now().toString(),
        },
      ],
    });

    console.log(`📨 Published to ${topic}:`, event);
  }

  async publishTestStart(testInfo: any): Promise<void> {
    const event = {
      type: "TEST_START",
      testId: testInfo.testId,
      testName: testInfo.title,
      file: testInfo.file,
      timestamp: new Date().toISOString(),
    };
    await this.publishEvent("test-events", event);
  }

  async publishTestEnd(
    testInfo: any,
    result: "passed" | "failed",
  ): Promise<void> {
    const event = {
      type: "TEST_END",
      testId: testInfo.testId,
      testName: testInfo.title,
      result,
      duration: testInfo.duration,
      timestamp: new Date().toISOString(),
    };
    await this.publishEvent("test-results", event);
  }

  async publishMetric(metric: any): Promise<void> {
    const event = {
      ...metric,
      timestamp: new Date().toISOString(),
    };
    await this.publishEvent("test-metrics", event);
  }

  // ══════════════════════════════════════════════════════════
  // CONSUMER: Read events from Kafka
  // ══════════════════════════════════════════════════════════

  async initConsumer(groupId: string, topics: string[]): Promise<Consumer> {
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
    });

    await consumer.connect();
    await consumer.subscribe({ topics, fromBeginning: false });

    this.consumers.set(groupId, consumer);
    console.log(`✅ Kafka consumer connected (group: ${groupId})`);

    return consumer;
  }

  async consumeMessages(
    groupId: string,
    topics: string[],
    handler: (payload: EachMessagePayload) => Promise<void>,
  ): Promise<void> {
    let consumer = this.consumers.get(groupId);

    if (!consumer) {
      consumer = await this.initConsumer(groupId, topics);
    }

    await consumer.run({
      eachMessage: handler,
    });
  }

  // ══════════════════════════════════════════════════════════
  // CLEANUP
  // ══════════════════════════════════════════════════════════

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      console.log("🔌 Kafka producer disconnected");
    }

    for (const [groupId, consumer] of this.consumers) {
      await consumer.disconnect();
      console.log(`🔌 Kafka consumer disconnected (group: ${groupId})`);
    }

    this.consumers.clear();
  }
}

// Singleton instance
export const kafkaHelper = new KafkaHelper();
