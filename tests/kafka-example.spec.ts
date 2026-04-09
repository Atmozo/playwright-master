import { test, expect } from "@playwright/test";
import { kafkaHelper } from "../utils/kafka-helper";

test.describe("Kafka Event-Driven Tests", () => {
  test.beforeAll(async () => {
    // Initialize Kafka producer
    await kafkaHelper.initProducer();
  });

  test.afterAll(async () => {
    // Cleanup Kafka connections
    await kafkaHelper.disconnect();
  });

  // ══════════════════════════════════════════════════════════
  // Test 1: Publish test start/end events
  // ══════════════════════════════════════════════════════════

  test("should publish test lifecycle events", async ({ page }, testInfo) => {
    // Publish test start event
    await kafkaHelper.publishTestStart(testInfo);

    // Execute test
    await page.goto("https://practice.expandtesting.com");
    await expect(page).toHaveTitle(/Practice/);

    // Publish test end event
    await kafkaHelper.publishTestEnd(testInfo, "passed");
  });

  // ══════════════════════════════════════════════════════════
  // Test 2: Publish performance metrics
  // ══════════════════════════════════════════════════════════

  test("should publish performance metrics", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("https://practice.expandtesting.com");

    const loadTime = Date.now() - startTime;

    // Publish metric to Kafka
    await kafkaHelper.publishMetric({
      type: "PAGE_LOAD",
      url: page.url(),
      duration: loadTime,
      browser: "chromium",
    });

    expect(loadTime).toBeLessThan(5000);
  });

  // ══════════════════════════════════════════════════════════
  // Test 3: Publish custom events
  // ══════════════════════════════════════════════════════════

  test("should publish custom test events", async ({ page }) => {
    await page.goto("https://practice.expandtesting.com");

    // Click login button
    await page.click("text=Login");

    // Publish user action event
    await kafkaHelper.publishEvent("test-events", {
      type: "USER_ACTION",
      action: "click",
      element: "login-button",
      page: page.url(),
    });

    // Fill login form
    await page.fill("#username", "testuser");
    await page.fill("#password", "testpass");

    // Publish form filled event
    await kafkaHelper.publishEvent("test-events", {
      type: "FORM_FILLED",
      form: "login-form",
      fields: ["username", "password"],
    });
  });

  // ══════════════════════════════════════════════════════════
  // Test 4: API test with Kafka events
  // ══════════════════════════════════════════════════════════

  test("should publish API test results", async ({ request }) => {
    const response = await request.get("https://dog.ceo/api/breeds/list/all");

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Publish API test result
    await kafkaHelper.publishEvent("test-results", {
      type: "API_TEST",
      endpoint: "https://dog.ceo/api/breeds/list/all",
      status: response.status(),
      responseTime: response.headers()["x-response-time"] || "N/A",
      success: response.ok(),
    });
  });
});
