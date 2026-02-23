// ============================================================
// 🎓 LEVEL 1 — Challenge 1: Login Flow
// Site: https://practice.expandtesting.com/login
// ============================================================
//
// KEYS IN THIS FILE:
//  ✅ test.describe → grouping related tests
//  ✅ test.beforeEach → shared setup (DRY principle)
//  ✅ test isolation → each test starts fresh
//  ✅ Positive testing (happy path)
//  ✅ Negative testing (error paths)
//  ✅ getByRole, getByLabel, locator
//  ✅ expect assertions: toBeVisible, toContainText, toHaveURL
//  ✅ Page Object Model in action
//
// 📖 PLAYWRIGHT DOCS TO READ (bookmark these):
//  Locators:    https://playwright.dev/docs/locators
//  Assertions:  https://playwright.dev/docs/test-assertions
//  POM:         https://playwright.dev/docs/pom
//  test.use:    https://playwright.dev/docs/api/class-test
// ============================================================

import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/loginPage";
import { VALID_USER, INVALID_CREDENTIALS, MESSAGES } from "../../data/users";

// ── test.describe ────────────────────────────────────────────
// Groups related tests under a name.
// In HTML reports, all these tests appear under "Login Flow".
// Think of it like a test suite class in JUnit/pytest.
//
// 📖 https://playwright.dev/docs/api/class-test#test-describe
test.describe("Login Flow", () => {
  // ── STEP 1: Declare page object variable ──────────────────
  // I declare it here so it's accessible in beforeEach
  // AND in every test block.
  let loginPage: LoginPage;

  // ── test.beforeEach ───────────────────────────────────────
  // Runs BEFORE every single test in this describe block.
  // This is TEST ISOLATION — each test gets:
  //   • A fresh browser context (no cookies from previous test)
  //   • A fresh page object
  //   • Navigated to the login URL
  //
  // WHY? If Test A logs in and Test B relies on that session,
  // you get FALSE results. Tests must be independent.
  //
  // 📖 https://playwright.dev/docs/api/class-test#test-before-each
  test.beforeEach(async ({ page }) => {
    // { page } is dependency injection — Playwright gives us
    // a fresh Page for each test automatically.
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // ══════════════════════════════════════════════════════════
  // ✅ POSITIVE TESTS — Happy Path
  // ══════════════════════════════════════════════════════════

  test("TC-L01 | should display login page correctly", async () => {
    // CONCEPT: Verify the page loaded before trying anything.
    // A "smoke test" — if this fails, all other tests will too.

    // toBeVisible → checks element exists AND is visible
    // (not just in the DOM but actually shown to the user)
    // 📖 https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-visible
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // toHaveTitle → checks the <title> tag in the HTML
    // 📖 https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-title
    await expect(loginPage.page).toHaveTitle(/Login/i);
  });

  test("TC-L02 | should login successfully with valid credentials", async () => {
    // CONCEPT: The "Happy Path" — the golden scenario.
    // Always write this test first.

    // I use our data file — no magic strings in tests
    await loginPage.login(VALID_USER.username, VALID_USER.password);

    // After login, two things should happen:
    //  1. URL changes to /secure
    //  2. Success flash message appears
    await loginPage.expectOnSecurePage();
    await loginPage.expectSuccessMessage(MESSAGES.loginSuccess);
  });

  test("TC-L03 | should logout successfully after login", async ({ page }) => {
    // CONCEPT: Test the full auth lifecycle in one test.
    // Login → verify secure area → logout → verify back on login

    await loginPage.login(VALID_USER.username, VALID_USER.password);
    await loginPage.expectOnSecurePage();

    // Logout is defined in our LoginPage POM
    await loginPage.logout();

    // After logout, should be back on login page with a message
    await expect(page).toHaveURL(/login/);

    // toContainText → partial match, flexible for dynamic messages
    // 📖 https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-contain-text
    await expect(loginPage.flashMessage).toContainText(MESSAGES.logoutSuccess);
  });

  // ══════════════════════════════════════════════════════════
  // ❌ NEGATIVE TESTS — Error Paths
  // ══════════════════════════════════════════════════════════
  // These are JUST AS IMPORTANT as positive tests.
  // They prove your app fails gracefully with useful messages.

  test("TC-L04 | should show error for invalid username", async () => {
    await loginPage.login(
      INVALID_CREDENTIALS.wrongUsername,
      VALID_USER.password,
    );

    // toContainText → checks for substring, not exact match
    // Useful when the message has extra whitespace or icons
    await loginPage.expectErrorMessage(MESSAGES.invalidPassword);

    // User must STAY on the login page after failure
    await expect(loginPage.page).toHaveURL(/login/);
  });

  test("TC-L05 | should show error for invalid password", async () => {
    await loginPage.login(
      VALID_USER.username,
      INVALID_CREDENTIALS.wrongPassword,
    );

    await loginPage.expectErrorMessage(MESSAGES.invalidPassword);
    await expect(loginPage.page).toHaveURL(/login/);
  });

  test("TC-L06 | should not login with empty username", async ({ page }) => {
    // CONCEPT: Testing empty / boundary inputs
    // The browser's HTML5 validation fires before the form submits

    await loginPage.fillUsername("");
    await loginPage.fillPassword(VALID_USER.password);
    await loginPage.clickLogin();

    // Form should NOT have submitted → still on /login
    // 📖 toHaveURL uses regex or exact string
    //   https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url
    await expect(page).toHaveURL(/login/);
  });

  test("TC-L07 | should not login with empty password", async ({ page }) => {
    await loginPage.fillUsername(VALID_USER.username);
    await loginPage.fillPassword("");
    await loginPage.clickLogin();

    await expect(page).toHaveURL(/login/);
  });

  test("TC-L08 | should not login with both fields empty", async ({ page }) => {
    // Click without filling anything
    await loginPage.clickLogin();
    await expect(page).toHaveURL(/login/);
  });

  test("TC-L09 | should not login with SQL injection attempt", async () => {
    // CONCEPT: Security-minded testing
    // Your test suite should verify the app handles
    // dangerous input safely — no crash, no bypass.
    await loginPage.login(
      INVALID_CREDENTIALS.sqlInjection,
      INVALID_CREDENTIALS.sqlInjection,
    );
    await loginPage.expectErrorMessage(MESSAGES.invalidUsername);
  });

  // ══════════════════════════════════════════════════════════
  // 🔍 LOCATOR CONCEPTS DEMO
  // ══════════════════════════════════════════════════════════

  test("TC-L10 | locator strategies demonstration", async ({ page }) => {
    // This test TEACHES locator strategies — not a "real" test.
    // Run it to see them all work.

    // STRATEGY 1: getByLabel (preferred for form inputs)
    // Links to the <label> element — robust, accessible
    const username1 = page.getByLabel("Username");

    // STRATEGY 2: getByRole (preferred for buttons, links, headings)
    // Uses ARIA roles — works even if CSS classes change
    const button1 = page.getByRole("button", { name: "Login" });

    // STRATEGY 3: getByPlaceholder (when no label exists)
    // Less resilient — placeholder text often changes
    // const username2 = page.getByPlaceholder('Username');

    // STRATEGY 4: locator with CSS (use as last resort)
    // Brittle if IDs/classes are auto-generated
    const username3 = page.locator("#username");

    // STRATEGY 5: getByTestId (BEST for production apps)
    // Requires dev to add data-testid attributes
    // const username4 = page.getByTestId('username-input');

    // Verify they all find the same element
    await expect(username1).toBeVisible();
    await expect(button1).toBeVisible();
    await expect(username3).toBeVisible();

    // 📖 Locator priority guide:
    //   getByRole > getByLabel > getByText > getByTestId > CSS
    //   https://playwright.dev/docs/locators#locating-elements
  });
});
