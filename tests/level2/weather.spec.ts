// ============================================================
// 🌤️ Weather API Tests - EXACT Conversion from  Java
// ============================================================
//
// This is a 1:1 conversion maintaining:
//  ✅ Same test names
//  ✅ Same assertions
//  ✅ Same test descriptions
//  ✅ Same severity levels
//  ✅ Same test flow
// ============================================================

import { test, expect } from "@playwright/test";
import { Weather_baseURL, appid } from "../../api/basePaths";
import { Success_Status_Code } from "../../api/statusCodes";

test.describe("WeatherApi - Get weather data", () => {
  // ══════════════════════════════════════════════════════════
  // @BeforeClass equivalent - runs once before all tests
  // ══════════════════════════════════════════════════════════
  test.beforeAll(() => {
    // Java: @BeforeClass public void getAuthorization()
    // In Playwright, we just verify API key exists
    if (!appid) {
      console.warn("⚠️  appid not set! Set it in .env file");
    }
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Get current weather by city")
  // @Severity(SeverityLevel.CRITICAL)
  // public void getCurrentWeatherByCityTest()
  // ══════════════════════════════════════════════════════════
  test("getCurrentWeatherByCityTest", async ({ request }) => {
    const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
      params: {
        q: "London",
        appid: appid,
      },
    });

    // .statusCode(Success_Status_Code)
    expect(response.status()).toBe(Success_Status_Code);

    const data = await response.json();

    // .body("name", equalToIgnoringCase("London"))
    expect(data.name.toLowerCase()).toBe("london");

    // .body("main.temp", notNullValue())
    expect(data.main.temp).toBeTruthy();

    // .body("weather[0].description", notNullValue())
    expect(data.weather[0].description).toBeTruthy();
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Get current weather by coordinates")
  // @Severity(SeverityLevel.CRITICAL)
  // public void getCurrentWeatherByCoordinatesTest()
  // ══════════════════════════════════════════════════════════
  test("getCurrentWeatherByCoordinatesTest", async ({ request }) => {
    const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
      params: {
        lat: "-26.2041",
        lon: "28.0473",
        appid: appid,
      },
    });

    expect(response.status()).toBe(Success_Status_Code);

    const data = await response.json();

    // .body("coord.lat", notNullValue())
    expect(data.coord.lat).toBeTruthy();

    // .body("coord.lon", notNullValue())
    expect(data.coord.lon).toBeTruthy();

    // .body("main.temp", notNullValue())
    expect(data.main.temp).toBeTruthy();
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Get weather for multiple cities")
  // @Severity(SeverityLevel.NORMAL)
  // public void getWeatherForMultipleCitiesTest()
  // ══════════════════════════════════════════════════════════
  test("getWeatherForMultipleCitiesTest", async ({ request }) => {
    const cities = ["Paris", "Tokyo", "New York", "Sydney", "Cairo"];

    for (const city of cities) {
      const response = await request.get(
        `${Weather_baseURL}/data/2.5/weather`,
        {
          params: {
            q: city,
            appid: appid,
          },
        },
      );

      expect(response.status()).toBe(Success_Status_Code);

      const data = await response.json();
      expect(data.main.temp).toBeTruthy();
    }
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Verify weather response contains all required fields")
  // @Severity(SeverityLevel.CRITICAL)
  // public void verifyWeatherResponseFieldsTest()
  // ══════════════════════════════════════════════════════════
  test("verifyWeatherResponseFieldsTest", async ({ request }) => {
    const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
      params: {
        q: "London",
        appid: appid,
      },
    });

    expect(response.status()).toBe(Success_Status_Code);

    const data = await response.json();

    // .body("coord", notNullValue())
    expect(data.coord).toBeTruthy();

    // .body("weather", notNullValue())
    expect(data.weather).toBeTruthy();

    // .body("main", notNullValue())
    expect(data.main).toBeTruthy();

    // .body("wind", notNullValue())
    expect(data.wind).toBeTruthy();

    // .body("clouds", notNullValue())
    expect(data.clouds).toBeTruthy();

    // .body("sys", notNullValue())
    expect(data.sys).toBeTruthy();

    // .body("name", notNullValue())
    expect(data.name).toBeTruthy();
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Verify temperature values are realistic")
  // @Severity(SeverityLevel.NORMAL)
  // public void verifyTemperatureRangeTest()
  // ══════════════════════════════════════════════════════════
  test("verifyTemperatureRangeTest", async ({ request }) => {
    const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
      params: {
        q: "London",
        appid: appid,
      },
    });

    expect(response.status()).toBe(Success_Status_Code);

    const data = await response.json();

    // .body("main.temp", greaterThan(173f))
    expect(data.main.temp).toBeGreaterThan(173);

    // .body("main.temp", lessThan(373f))
    expect(data.main.temp).toBeLessThan(373);

    // .body("main.humidity", greaterThanOrEqualTo(0))
    expect(data.main.humidity).toBeGreaterThanOrEqual(0);

    // .body("main.humidity", lessThanOrEqualTo(100))
    expect(data.main.humidity).toBeLessThanOrEqual(100);
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Verify wind data is present")
  // @Severity(SeverityLevel.NORMAL)
  // public void verifyWindDataTest()
  // ══════════════════════════════════════════════════════════
  test("verifyWindDataTest", async ({ request }) => {
    const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
      params: {
        q: "Chicago",
        appid: appid,
      },
    });

    expect(response.status()).toBe(Success_Status_Code);

    const data = await response.json();

    // .body("wind.speed", notNullValue())
    expect(data.wind.speed).toBeTruthy();

    // .body("wind.speed", greaterThanOrEqualTo(0f))
    expect(data.wind.speed).toBeGreaterThanOrEqual(0);
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Get weather with invalid city returns 404")
  // @Severity(SeverityLevel.NORMAL)
  // public void getWeatherInvalidCityTest()
  // ══════════════════════════════════════════════════════════
  test("getWeatherInvalidCityTest", async ({ request }) => {
    const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
      params: {
        q: "InvalidCityXYZ123",
        appid: appid,
      },
    });

    // .statusCode(404)
    expect(response.status()).toBe(404);
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Get weather with empty city returns 400")
  // @Severity(SeverityLevel.MINOR)
  // public void getWeatherEmptyCityTest()
  // ══════════════════════════════════════════════════════════
  test("getWeatherEmptyCityTest", async ({ request }) => {
    const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
      params: {
        q: "",
        appid: appid,
      },
    });

    // .statusCode(400)
    expect(response.status()).toBe(400);
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Verify response time is under 3 seconds")
  // @Severity(SeverityLevel.NORMAL)
  // public void verifyResponseTimeTest()
  // ══════════════════════════════════════════════════════════
  test("verifyResponseTimeTest", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
      params: {
        q: "London",
        appid: appid,
      },
    });

    const responseTime = Date.now() - startTime;

    // assert responseTime < 3000
    expect(responseTime).toBeLessThan(3000);
    console.log(`Response time: ${responseTime}ms`);

    expect(response.status()).toBe(Success_Status_Code);
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("Get weather by city ID")
  // @Severity(SeverityLevel.NORMAL)
  // public void getWeatherByCityIdTest()
  // ══════════════════════════════════════════════════════════
  test("getWeatherByCityIdTest", async ({ request }) => {
    const response = await request.get(`${Weather_baseURL}/data/2.5/weather`, {
      params: {
        id: "2643743", // London city ID
        appid: appid,
      },
    });

    expect(response.status()).toBe(Success_Status_Code);

    const data = await response.json();

    // .body("id", equalTo(2643743))
    expect(data.id).toBe(2643743);

    // .body("name", equalToIgnoringCase("London"))
    expect(data.name.toLowerCase()).toBe("london");
  });
});

// ============================================================
// 📊 CONVERSION SUMMARY
// ============================================================
//
// Java/REST Assured               | Playwright
// --------------------------------|---------------------------
// @BeforeClass                    | test.beforeAll()
// @Test                           | test('name', async ({})
// @Description("...")             | test name as description
// @Severity(SeverityLevel.X)      | (optional in Playwright)
// given().baseUri()               | request.get(url)
// .queryParam("key", "val")       | params: {key: 'val'}
// .statusCode(200)                | expect(response.status()).toBe(200)
// .body("key", equalTo(val))      | expect(data.key).toBe(val)
// .body("key", notNullValue())    | expect(data.key).toBeTruthy()
// .body("key", greaterThan(x))    | expect(data.key).toBeGreaterThan(x)
// response.getTime()              | Date.now() - startTime
//
// ============================================================
