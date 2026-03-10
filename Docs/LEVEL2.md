# 🎓 Playwright Level 2 — API Testing Complete Guide

> **APIs tested:** Dog CEO · OpenWeatherMap · ReqRes (JSONPlaceholder)

---

## Test Results — 23/23 Passing ✅

### Dogs API (11 Tests)

| Test                                | Endpoint                                |
| ----------------------------------- | --------------------------------------- |
| getListOfAllBreedsTests             | GET /breeds/list/all                    |
| getSingleRandomImageTests           | GET /breeds/image/random                |
| getMultipleRandomImageTests         | GET /breeds/image/random/3              |
| getDogsImagesByBreedTests           | GET /breed/hound/images                 |
| getRandomImagesFromBreedTests       | GET /breed/hound/images/random          |
| getMultipleImagesFromBreedTests     | GET /breed/hound/images/random/3        |
| getListOfAllSubBreedsTests          | GET /breed/hound/list                   |
| getListOfAllSubBreedImagesTests     | GET /breed/hound/afghan/images          |
| getSingleRandomImageSubBreedTests   | GET /breed/hound/afghan/images/random   |
| getMultipleRandomImageSubBreedTests | GET /breed/hound/afghan/images/random/3 |
| getBreedListTests                   | GET /breeds/list/all                    |

### Weather API (10 Tests)

| Test                               | Scenario                    |
| ---------------------------------- | --------------------------- |
| getCurrentWeatherByCityTest        | GET by city name            |
| getCurrentWeatherByCoordinatesTest | GET by lat/lon              |
| getWeatherForMultipleCitiesTest    | Loop 5 cities               |
| verifyWeatherResponseFieldsTest    | All required fields present |
| verifyTemperatureRangeTest         | Kelvin range 173–373        |
| verifyWindDataTest                 | Wind speed >= 0             |
| getWeatherInvalidCityTest          | Expects 404                 |
| getWeatherEmptyCityTest            | Expects 400                 |
| verifyResponseTimeTest             | Under 3000ms                |
| getWeatherByCityIdTest             | GET by city ID              |

### ReqRes API (2 Tests)

| Test                | Endpoint    |
| ------------------- | ----------- |
| createEmployeeTests | POST /users |
| getEmployeeTests    | GET /users  |

---

## Core Concepts

### API Requests with `request` fixture

```typescript
test("example", async ({ request }) => {
  const response = await request.get("https://api.example.com/data");
  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(data.status.toLowerCase()).toContain("success");
});
```

For POST with body and headers:

```typescript
const response = await request.post("https://api.example.com/users", {
  headers: { "Content-Type": "application/json" },
  data: { name: "Nkosi", job: "Tester" },
});
expect(response.status()).toBe(201);
```

> https://playwright.dev/docs/api-testing

---

### Query Parameters

```typescript
const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
  params: {
    q: "London",
    appid: appid,
  },
});
```

---

### Environment Variables

Store secrets in `.env`, never hardcode them.

```bash
# .env
OPENWEATHER_API_KEY=your_key_here
WEATHER_BASE_URL=https://api.openweathermap.org
REQRES_BASE_URL=https://reqres.in
DOGS_BASE_URL=https://dog.ceo/api
```

```typescript
// api/basePaths.ts
export const Weather_baseURL =
  process.env.WEATHER_BASE_URL || "https://api.openweathermap.org";
export const appid = process.env.OPENWEATHER_API_KEY || "";
```

```typescript
// playwright.config.ts  ← REQUIRED
import dotenv from "dotenv";
dotenv.config();
```

> ⚠️ Without `dotenv.config()` in your config file, all `process.env.*` values are `undefined` at runtime.

---

### Status Code Assertions

```typescript
expect(response.status()).toBe(200); // success
expect(response.status()).toBe(201); // created
expect(response.status()).toBe(400); // bad request
expect(response.status()).toBe(401); // unauthorized
expect(response.status()).toBe(404); // not found
expect(response.status()).toBe(500); // server error
```

---

### Body Assertions

```typescript
const data = await response.json();

expect(data.status.toLowerCase()).toContain("success"); // string contains
expect(data.name.toLowerCase()).toBe("london"); // exact match
expect(data.main.temp).toBeTruthy(); // not null/undefined
expect(data.main.temp).toBeGreaterThan(173); // numeric range
expect(data.main.temp).toBeLessThan(373);
expect(data.main.humidity).toBeGreaterThanOrEqual(0);
expect(data.main.humidity).toBeLessThanOrEqual(100);
expect(data.id).toBe(2643743); // exact number
```

---

### Response Time Testing

```typescript
const startTime = Date.now();
const response = await request.get(`${baseURL}/endpoint`);
const responseTime = Date.now() - startTime;

expect(responseTime).toBeLessThan(3000);
console.log(`Response time: ${responseTime}ms`);
```

---

### Loop Testing (Multiple Items)

```typescript
const cities = ["Paris", "Tokyo", "New York", "Sydney", "Cairo"];

for (const city of cities) {
  const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
    params: { q: city, appid },
  });
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.main.temp).toBeTruthy();
}
```

---

## Network Mocking — Playwright Exclusive 🚀

> ❌ Java / REST Assured cannot do this — it's server-to-server only.
> ✅ Playwright controls the browser's network layer.

### Mock a successful response

```typescript
await page.route("**/breeds/list/all", (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ status: "success", message: { "fake-dog": [] } }),
  });
});
```

### Simulate a server error

```typescript
await page.route("**/breeds/list/all", (route) => {
  route.fulfill({ status: 500, body: "Internal Server Error" });
});
```

### Add artificial delay

```typescript
await page.route("**/breeds/list/all", async (route) => {
  await page.waitForTimeout(3000);
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ status: "success", message: {} }),
  });
});
```

### Block images (faster tests)

```typescript
await page.route("**/*.{png,jpg,jpeg,gif}", (route) => route.abort());
```

### Inject auth headers

```typescript
await page.route("**/api/**", async (route, request) => {
  await route.continue({
    headers: { ...request.headers(), Authorization: "Bearer fake-token-123" },
  });
});
```

### Log all API calls

```typescript
const calls: string[] = [];
await page.route("**/api/**", async (route, request) => {
  calls.push(request.url());
  await route.continue();
});
```

> https://playwright.dev/docs/network

---

---

## Issues Fixed

### 🐛 Dogs API — Nested `test()` bug

**Problem:** `test()` was accidentally nested inside another `test()`. Playwright throws before any test runs.

```typescript
// ❌ BROKEN
test('getListOfAllBreedsTests', async ({ request }) => {
  test('getListOfAllBreedsTests', async ({ request }) => { // nested!
```

```typescript
// ✅ FIXED
test("getListOfAllBreedsTests", async ({ request }) => {
  const response = await request.get(`${DogsAPI_baseURL}/breeds/list/all`);
  expect(response.status()).toBe(200);
});
```

---

### 🐛 Weather API — 401 Unauthorized

**Problem:** All 10 weather tests returned 401. `OPENWEATHER_API_KEY` was `undefined` at runtime.

**Root cause:** `dotenv.config()` was missing from `playwright.config.ts`.

**Fix:**

```typescript
// playwright.config.ts
import dotenv from "dotenv";
dotenv.config(); // ← this one line fixed all 10 tests
```

---

## Running Tests

```bash
npx playwright test                                  # all tests
npx playwright test tests/level2/weather.spec.ts    # specific file
npx playwright test tests/level2/ --headed          # see requests
npx playwright test -g "getCurrentWeather"          # by name pattern
npx playwright test --ui                            # visual mode
npx playwright show-report                          # HTML report
```

---

## Level 3 Preview — Advanced Engineering

| #   | Topic                             | Key Skills                                     |
| --- | --------------------------------- | ---------------------------------------------- |
| 11  | Parallel Projects (Multi-Browser) | `playwright.config` projects, workers, retries |
| 12  | Flaky Test Stabilization          | `expect.poll()`, proper waits, trace viewer    |
| 13  | Authentication Handling           | `storageState`, global setup, OAuth            |
| 14  | Dynamic ID + Shifting Content     | Robust locator strategy                        |
| 15  | Reporting + Allure Integration    | CI artifacts, trace viewer, HTML reports       |

---

## Essential Docs

| Topic           | URL                                                     |
| --------------- | ------------------------------------------------------- |
| API Testing     | https://playwright.dev/docs/api-testing                 |
| Network Mocking | https://playwright.dev/docs/network                     |
| Request Fixture | https://playwright.dev/docs/api/class-apirequestcontext |
| Assertions      | https://playwright.dev/docs/test-assertions             |
| Best Practices  | https://playwright.dev/docs/best-practices              |
