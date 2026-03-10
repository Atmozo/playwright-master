// ============================================================
//  LECTURE: playwright.config.ts — The Control Centre
// ============================================================
// This file controls EVERYTHING about how your tests run:
//  - Which browser(s)
//  - Base URL
//  - Timeout
//  - Parallel execution
//  - Retries on failure
//  - Reports
//  - Screenshots / Videos / Trace
//
//  PLAYWRIGHT DOC:
//   https://playwright.dev/docs/test-configuration
// ============================================================

import { defineConfig, devices } from "@playwright/test";

import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  // ── WHERE ARE YOUR TESTS? ─────────────────────────────────
  // Playwright scans this folder recursively for *.spec.ts
  testDir: "./tests",

  // ── PARALLEL EXECUTION ───────────────────────────────────
  // fullyParallel: true → each TEST runs in parallel
  // false → each FILE runs in parallel (tests within a file are sequential)
  //
  // START with false while learning (easier to debug)
  // Switch to true for faster CI runs
  //  https://playwright.dev/docs/test-parallel
  fullyParallel: false,

  // ── RETRIES ───────────────────────────────────────────────
  // On CI: retry failed tests twice before marking as failed.
  // Locally: no retries (so you see failures immediately)
  //
  // CAUTION: Retries hide flaky tests. Fix the root cause!
  //  https://playwright.dev/docs/test-retries
  retries: process.env.CI ? 2 : 0,

  // ── WORKERS ───────────────────────────────────────────────
  // How many parallel browser instances to run.
  // CI: 1 (limited resources), Local: auto-detect CPU cores
  workers: process.env.CI ? 1 : undefined,

  // ── REPORTERS ─────────────────────────────────────────────
  // 'html' → generates a beautiful HTML report in playwright-report/
  // 'list' → prints test results in the terminal as they run
  //
  //  https://playwright.dev/docs/test-reporters
  reporter: [["html"], ["json", { outputFile: "test-results/results.json" }]],
  // ── GLOBAL TEST SETTINGS ─────────────────────────────────
  // These apply to ALL tests in all projects unless overridden.
  use: {
    // BASE URL: All page.goto('/login') calls prepend this.
    // Change this one value for staging vs production testing.
    //  https://playwright.dev/docs/api/class-page#page-goto
    baseURL: "https://practice.expandtesting.com",

    // TRACE: Records every action for debugging failed tests.
    // 'on-first-retry' = only record when a test fails and retries.
    // Open trace: npx playwright show-trace trace.zip
    //  https://playwright.dev/docs/trace-viewer
    trace: "on-first-retry",

    // SCREENSHOT: Take a screenshot when a test fails.
    //  https://playwright.dev/docs/screenshots
    screenshot: "only-on-failure",

    // VIDEO: Record video of test execution on failure.
    //  https://playwright.dev/docs/videos
    video: "on-first-retry",

    // ACTION TIMEOUT: How long to wait for a single action
    // like click(), fill(), waitForSelector()
    actionTimeout: 10_000, // 10 seconds

    // NAVIGATION TIMEOUT: How long to wait for page.goto()
    navigationTimeout: 30_000, // 30 seconds
  },

  // ── GLOBAL TIMEOUT ────────────────────────────────────────
  // Maximum time for a single test to complete.
  // If it takes longer → TIMEOUT failure.
  timeout: 30_000, // 30 seconds per test

  // ── PROJECTS = BROWSERS ───────────────────────────────────
  // Each "project" runs your entire test suite in a different browser.
  // This is how Playwright does cross-browser testing.
  //
  // For learning: use only chromium (fast).
  // For production CI: run all three.
  //
  //  https://playwright.dev/docs/test-projects
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit", // Safari engine
      use: { ...devices["Desktop Safari"] },
    },

    // Mobile viewports:
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // ── WEB SERVER (optional) ─────────────────────────────────
  // If you're testing a LOCAL app, Playwright can start it for you:
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

// ══════════════════════════════════════════════════════════════
//  HOW TO RUN YOUR TESTS
// ══════════════════════════════════════════════════════════════
//
// Run ALL tests:
//   npx playwright test
//
// Run specific file:
//   npx playwright test tests/level1/login.spec.ts
//
// Run specific test by name:
//   npx playwright test -g "TC-L02"
//
// Run in headed mode (see the browser):
//   npx playwright test --headed
//
// Run with UI mode (interactive explorer):
//   npx playwright test --ui
//
// Show HTML report:
//   npx playwright show-report
//
// Debug a specific test (step through it):
//   npx playwright test tests/level1/login.spec.ts --debug
//
// Generate code by recording your actions:
//   npx playwright codegen https://practice.expandtesting.com/login
//
// ══════════════════════════════════════════════════════════════
