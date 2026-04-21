// ============================================================
// 🎯 YOUR FIRST k6 LOAD TEST
// ============================================================
// Tests: Dogs API - Get random dog image
// Type: Smoke test (baseline)
// ============================================================

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ══════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════

export const options = {
  // Smoke test: Verify system works under minimal load
  stages: [
    { duration: "30s", target: 5 }, // Ramp up to 5 users
    { duration: "1m", target: 5 }, // Stay at 5 users
    { duration: "30s", target: 0 }, // Ramp down to 0
  ],

  thresholds: {
    // HTTP errors should be less than 1%
    http_req_failed: ["rate<0.01"],

    // 95% of requests should be below 500ms
    http_req_duration: ["p(95)<500"],

    // 99% of requests should be below 1s
    "http_req_duration{type:api}": ["p(99)<1000"],
  },
};

// ══════════════════════════════════════════════════════════
// CUSTOM METRICS
// ══════════════════════════════════════════════════════════

const errorRate = new Rate("errors");
const apiDuration = new Trend("api_response_time");

// ══════════════════════════════════════════════════════════
// TEST SCENARIO
// ══════════════════════════════════════════════════════════

export default function () {
  // Test 1: Get random dog image
  const response = http.get("https://dog.ceo/api/breeds/image/random", {
    tags: { type: "api" },
  });

  // Validate response
  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "response has message": (r) => r.json("message") !== undefined,
    "message is URL": (r) => r.json("message").includes("http"),
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  // Record custom metrics
  errorRate.add(!success);
  apiDuration.add(response.timings.duration);

  // Think time between requests
  sleep(1);
}

// ══════════════════════════════════════════════════════════
// LIFECYCLE HOOKS
// ══════════════════════════════════════════════════════════

export function setup() {
  console.log("🚀 Starting smoke test...");
  console.log("Target: Dogs API");
  console.log("Duration: 2 minutes");
  console.log("Virtual Users: 5");
}

export function teardown(data) {
  console.log("✅ Smoke test complete!");
}
