# 🚀 Parallel Execution & Workers - The Complete Guide

> Make your tests execute in parallel for 10x faster CI/CD

---

## 📚 Understanding Playwright's Execution Model

### The Worker Concept

**Worker = Separate Node.js process running tests**

```
Test Suite (100 tests)
│
├─ Worker 1 (Process A) → Tests 1-25
├─ Worker 2 (Process B) → Tests 26-50
├─ Worker 3 (Process C) → Tests 51-75
└─ Worker 4 (Process D) → Tests 76-100

All running SIMULTANEOUSLY ⚡
```

Each worker gets:

- Its own browser instance
- Its own browser context
- Isolated test environment
- No shared state with other workers

---

## 🎯 Configuring Parallelization

### playwright.config.ts

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  // ══════════════════════════════════════════════════════════
  // 📖 WORKERS: How many parallel processes
  // ══════════════════════════════════════════════════════════

  // Option 1: Auto-detect CPU cores (RECOMMENDED for local)
  workers: undefined, // Uses 50% of CPU cores

  // Option 2: Fixed number
  workers: 4, // Always use 4 workers

  // Option 3: Percentage
  workers: "75%", // Use 75% of CPU cores

  // Option 4: CI optimization
  workers: process.env.CI ? 2 : undefined,

  // ══════════════════════════════════════════════════════════
  // 📖 FULLY PARALLEL: Test vs File Level
  // ══════════════════════════════════════════════════════════

  // false (DEFAULT): Tests in same file run sequentially
  //                  But different files run in parallel
  fullyParallel: false,

  // true: EVERY test runs in parallel (even in same file)
  //       Fastest, but requires careful test isolation
  fullyParallel: true,

  // ══════════════════════════════════════════════════════════
  // 📖 TEST SHARDING: Split tests across multiple machines
  // ══════════════════════════════════════════════════════════

  shard: process.env.CI
    ? {
        total: 4, // Total number of machines
        current: parseInt(process.env.SHARD_INDEX || "1"), // This machine's index
      }
    : undefined,
});
```

---

## 🎮 CLI Commands for Parallel Control

```bash
# ══════════════════════════════════════════════════════════
# Run with default workers (auto-detect)
# ══════════════════════════════════════════════════════════
npx playwright test

# ══════════════════════════════════════════════════════════
# Sequential (one test at a time) - SLOWEST but easiest debugging
# ══════════════════════════════════════════════════════════
npx playwright test --workers=1

# ══════════════════════════════════════════════════════════
# Fixed number of workers
# ══════════════════════════════════════════════════════════
npx playwright test --workers=4      # Use 4 workers
npx playwright test --workers=8      # Use 8 workers

# ══════════════════════════════════════════════════════════
# Percentage of CPU cores
# ══════════════════════════════════════════════════════════
npx playwright test --workers=50%    # Half of CPU cores
npx playwright test --workers=100%   # All CPU cores (max speed, high resource use)

# ══════════════════════════════════════════════════════════
# Fully parallel (override config)
# ══════════════════════════════════════════════════════════
npx playwright test --fully-parallel

# ══════════════════════════════════════════════════════════
# Run specific file with workers
# ══════════════════════════════════════════════════════════
npx playwright test tests/auth.spec.ts --workers=2

# ══════════════════════════════════════════════════════════
# Run tests on specific shard (for CI)
# ══════════════════════════════════════════════════════════
npx playwright test --shard=1/4      # Machine 1 of 4
npx playwright test --shard=2/4      # Machine 2 of 4
npx playwright test --shard=3/4      # Machine 3 of 4
npx playwright test --shard=4/4      # Machine 4 of 4
```

---

## 📝 Per-File Parallel Control

### describe.configure()

```typescript
import { test, expect } from '@playwright/test';

// ══════════════════════════════════════════════════════════
// Run tests in this file SEQUENTIALLY (even with workers)
// ══════════════════════════════════════════════════════════
test.describe.configure({ mode: 'serial' });

test.describe('Login flow', () => {
  test('should show login page', async ({ page }) => { ... });
  test('should login successfully', async ({ page }) => { ... });
  test('should logout', async ({ page }) => { ... });
  // These 3 run one after another, share same worker
});

// ══════════════════════════════════════════════════════════
// Run tests in parallel (override config)
// ══════════════════════════════════════════════════════════
test.describe.configure({ mode: 'parallel' });

test.describe('Product tests', () => {
  test('test product 1', async ({ page }) => { ... });
  test('test product 2', async ({ page }) => { ... });
  test('test product 3', async ({ page }) => { ... });
  // These can run in different workers simultaneously
});

// ══════════════════════════════════════════════════════════
// Set timeout for slow tests
// ══════════════════════════════════════════════════════════
test.describe.configure({ timeout: 60000 });  // 60 seconds

// ══════════════════════════════════════════════════════════
// Retries for flaky tests
// ══════════════════════════════════════════════════════════
test.describe.configure({ retries: 2 });  // Retry failed tests 2 times
```

---

## 🎯 Test Isolation Best Practices

### The Golden Rule

**Each test must work in isolation, regardless of execution order**

```typescript
// ❌ BAD: Tests depend on each other
let userId: number;

test('create user', async ({ request }) => {
  const response = await request.post('/api/users', { data: {...} });
  userId = (await response.json()).id;  // Shared state!
});

test('update user', async ({ request }) => {
  // ❌ Assumes previous test ran first
  await request.patch(`/api/users/${userId}`, { data: {...} });
});

// ✅ GOOD: Each test is independent
test('create user', async ({ request }) => {
  const response = await request.post('/api/users', { data: {...} });
  const userId = (await response.json()).id;
  // Use userId only in this test
});

test('update user', async ({ request }) => {
  // Create own user
  const createResponse = await request.post('/api/users', { data: {...} });
  const userId = (await createResponse.json()).id;

  // Now update it
  await request.patch(`/api/users/${userId}`, { data: {...} });
});
```

### Use test.beforeEach for Setup

```typescript
test.describe('User management', () => {
  let userId: number;

  test.beforeEach(async ({ request }) => {
    // Runs BEFORE each test in same worker
    const response = await request.post('/api/users', { data: {...} });
    userId = (await response.json()).id;
  });

  test('should get user', async ({ request }) => {
    const response = await request.get(`/api/users/${userId}`);
    expect(response.ok()).toBeTruthy();
  });

  test('should update user', async ({ request }) => {
    await request.patch(`/api/users/${userId}`, { data: {...} });
    // Verify update
  });

  test.afterEach(async ({ request }) => {
    // Cleanup after each test
    await request.delete(`/api/users/${userId}`);
  });
});
```

---

## 🔧 Worker-Specific Patterns

### Shared State Across Tests in Same Worker

```typescript
// These tests run in same worker, share browser context
test.describe("Shopping cart", () => {
  test.describe.configure({ mode: "serial" });

  test("add item to cart", async ({ page }) => {
    await page.goto("/products");
    await page.click("#add-to-cart-1");
  });

  test("view cart", async ({ page }) => {
    // Same browser, cart still has item from previous test
    await page.goto("/cart");
    await expect(page.locator(".cart-item")).toHaveCount(1);
  });

  test("checkout", async ({ page }) => {
    await page.goto("/checkout");
    // Complete checkout
  });
});
```

### Independent Workers Pattern

```typescript
// Each test gets own worker and browser
test.describe("Product tests", () => {
  test.describe.configure({ mode: "parallel" });

  for (let i = 1; i <= 10; i++) {
    test(`should display product ${i}`, async ({ page }) => {
      await page.goto(`/products/${i}`);
      await expect(page.locator("h1")).toBeVisible();
    });
  }
  // All 10 tests run simultaneously in different workers
});
```

---

## ⚡ Performance Optimization Strategies

### 1. Group Fast Tests, Isolate Slow Tests

```typescript
// File: tests/fast.spec.ts
// These run in parallel (fast)
test.describe("Unit-like tests", () => {
  test("test 1", async ({ page }) => {
    /* <1s */
  });
  test("test 2", async ({ page }) => {
    /* <1s */
  });
  test("test 3", async ({ page }) => {
    /* <1s */
  });
});

// File: tests/slow.spec.ts
// These run sequentially (avoid resource contention)
test.describe.configure({ mode: "serial" });

test.describe("Integration tests", () => {
  test("test 1", async ({ page }) => {
    /* 10s */
  });
  test("test 2", async ({ page }) => {
    /* 15s */
  });
});
```

### 2. Use API for Setup, UI for Testing

```typescript
// ❌ SLOW: Create user via UI (30 seconds)
test('test user profile', async ({ page }) => {
  await page.goto('/register');
  await page.fill('#username', 'test');
  // ... 20 more fields ...
  await page.click('#submit');
  await page.waitForNavigation();

  // Now test profile page
  await page.goto('/profile');
});

// ✅ FAST: Create user via API (2 seconds)
test('test user profile', async ({ page, request }) => {
  const response = await request.post('/api/users', { data: {...} });
  const { id, token } = await response.json();

  // Set auth token
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);

  // Test profile page
  await page.goto('/profile');
});
```

### 3. Reuse Browser Contexts

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // Reuse browser between tests (faster)
    launchOptions: {
      // Don't close browser between tests
    },
  },

  // Each test gets fresh context (isolation maintained)
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Reuse browser, fresh context
      },
    },
  ],
});
```

---

## 📊 Measuring Parallel Performance

```bash
# ══════════════════════════════════════════════════════════
# Measure sequential execution
# ══════════════════════════════════════════════════════════
time npx playwright test --workers=1
# Example: 10 minutes

# ══════════════════════════════════════════════════════════
# Measure parallel execution
# ══════════════════════════════════════════════════════════
time npx playwright test --workers=4
# Example: 3 minutes (3.3x faster!)

# ══════════════════════════════════════════════════════════
# Measure with all cores
# ══════════════════════════════════════════════════════════
time npx playwright test --workers=100%
# Example: 2 minutes (5x faster, but high resource use)
```

---

## 🎯 CI/CD Configuration

### GitHub Actions Example

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4] # Split across 4 machines

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npx playwright test --shard=${{ matrix.shard }}/4

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-results-${{ matrix.shard }}
          path: test-results/
```

### Result

```
Total tests: 400
4 machines × 2 workers each = 8 parallel processes
Total time: ~10 minutes instead of 80 minutes!
```

---

## 🔍 Debugging Parallel Tests

```bash
# Run with UI mode to see all tests
npx playwright test --ui

# Run single test in headed mode
npx playwright test --headed --workers=1 -g "TC-001"

# Show which worker ran each test
npx playwright test --reporter=list

# Example output:
# [1/4] Worker 1: tests/auth.spec.ts:10:5 › should login
# [2/4] Worker 2: tests/products.spec.ts:15:5 › should add product
# [3/4] Worker 1: tests/auth.spec.ts:25:5 › should logout
# [4/4] Worker 2: tests/products.spec.ts:30:5 › should edit product
```

---

## ✅ Summary Checklist

### For Maximum Speed

- ✅ Use `fullyParallel: true` in config
- ✅ Set `workers` to 50-75% of CPU cores
- ✅ Use API for test data setup
- ✅ Ensure tests are isolated
- ✅ Use test sharding in CI

### For Debugging

- ✅ Use `--workers=1` to run sequentially
- ✅ Use `test.describe.configure({ mode: 'serial' })`
- ✅ Use `--headed` to see browser
- ✅ Use `--debug` for step-through

### For Reliability

- ✅ Clean up test data in `afterEach`
- ✅ Don't share state between tests
- ✅ Use `beforeEach` for setup
- ✅ Make tests order-independent
- ✅ Use unique test data (timestamps, UUIDs)

---

**Your tests can now execute in parallel for 10x faster CI/CD! 🚀**
