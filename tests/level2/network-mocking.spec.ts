// ============================================================
//  NETWORK MOCKING - Playwright Exclusive Feature
// ============================================================
//  CAN'T DO THIS IN JAVA/REST ASSURED!
//
// What: Intercept browser requests and return fake responses
// Why: Test UI without backend, simulate errors, test edge cases
//
// Java Limitation: REST Assured is server-to-server only
// Playwright Power: Controls browser network layer
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Network Mocking Examples", () => {
  test("MOCK-01: should mock successful API response", async ({ page }) => {
    console.log("\n Mocking API response");

    // Mock the API
    await page.route("**/breeds/list/all", (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: "success",
          message: { "test-breed": [], "fake-dog": [] },
        }),
      });
    });

    await page.goto("https://dog.ceo/dog-api/");
    console.log(" Page received MOCKED data!");
  });

  test("MOCK-02: should simulate 500 error", async ({ page }) => {
    console.log("\n Simulating server error");

    await page.route("**/breeds/list/all", (route) => {
      route.fulfill({
        status: 500,
        body: "Internal Server Error",
      });
    });

    await page.goto("https://dog.ceo/dog-api/");
    console.log(" Simulated 500 error without breaking real API!");
  });

  test("MOCK-03: should test slow response (3 seconds)", async ({ page }) => {
    console.log("\n Testing loading state");

    await page.route("**/breeds/list/all", async (route) => {
      await page.waitForTimeout(3000); // 3 second delay
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ status: "success", message: {} }),
      });
    });

    const start = Date.now();
    await page.goto("https://dog.ceo/dog-api/");
    const time = Date.now() - start;

    console.log(`  Loaded in ${time}ms (includes our delay)`);
    expect(time).toBeGreaterThan(3000);
  });

  test("MOCK-04: should block images to speed up tests", async ({ page }) => {
    console.log("\n Blocking images for faster tests");

    let blockedCount = 0;

    await page.route("**/*.{png,jpg,jpeg,gif}", (route) => {
      blockedCount++;
      route.abort();
    });

    const start = Date.now();
    await page.goto("https://dog.ceo/dog-api/");
    const time = Date.now() - start;

    console.log(` Blocked ${blockedCount} images`);
    console.log(` Loaded in ${time}ms (faster!)`);
  });

  test("MOCK-05: should add auth header to requests", async ({ page }) => {
    console.log("\n Adding auth token automatically");

    await page.route("**/api/**", async (route, request) => {
      await route.continue({
        headers: {
          ...request.headers(),
          Authorization: "Bearer fake-token-123",
        },
      });
    });

    await page.goto("https://dog.ceo/dog-api/");
    console.log(" All requests now have auth token!");
  });

  test("MOCK-06: should log all API calls", async ({ page }) => {
    console.log("\n Monitoring API calls");

    const calls: string[] = [];

    await page.route("**/api/**", async (route, request) => {
      calls.push(request.url());
      await route.continue();
    });

    await page.goto("https://dog.ceo/dog-api/");

    console.log(` Made ${calls.length} API calls:`);
    calls.forEach((url) => console.log(`  - ${url}`));
  });
});

// ============================================================
//  WHY JAVA/REST ASSURED CAN'T DO THIS
// ============================================================
//
// REST Assured:  API → API (server to server)
// Playwright:    Browser → API (can intercept!)
//
// REST Assured tests APIs directly
// Playwright controls the browser's network layer
//
// Example: Testing "What if API returns 500?"
// ────────────────────────────────────────────
// Java:  Need to actually break your API
// Playwright: Just mock it
//
// ============================================================
