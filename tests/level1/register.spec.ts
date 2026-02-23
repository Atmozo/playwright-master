// ============================================================
// 🎓 LEVEL 1 — Challenge 1+2: Register & Form Validation
// Site: https://practice.expandtesting.com/register
// ============================================================
//
// KEYS IN THIS FILE:
//  ✅ Form validation testing (positive + negative)
//  ✅ Password confirmation mismatch scenario
//  ✅ Boundary value testing (empty, short, long)
//  ✅ toHaveAttribute → checking required / disabled states
//  ✅ inputValue → reading what's currently in a field
//  ✅ clear() → clearing a field
//  ✅ press() → keyboard interactions
//  ✅ screenshot on failure (trace viewer)
//
// 📖 PLAYWRIGHT DOCS TO READ:
//  Input actions: https://playwright.dev/docs/input
//  Keyboard:      https://playwright.dev/docs/api/class-keyboard
//  Attributes:    https://playwright.dev/docs/api/class-locatorassertions
// ============================================================

import { test, expect } from "@playwright/test";
import { RegisterPage } from "../../pages/registerPage";
import { LoginPage } from "../../pages/loginPage";
import { uniqueUsername, MESSAGES } from "../../data/users";

test.describe("Register Flow", () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  // ══════════════════════════════════════════════════════════
  // ✅ POSITIVE TESTS
  // ══════════════════════════════════════════════════════════

  test("TC-R01 | should display register page correctly", async () => {
    await expect(registerPage.usernameInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
    await expect(registerPage.registerButton).toBeVisible();
  });

  test("TC-R02 | should register successfully with valid data", async () => {
    // CONCEPT: uniqueUsername() prevents collision between test runs.
    // If tests run in parallel or you re-run, same username would
    // cause "already taken" errors. Timestamp makes it unique.
    const username = uniqueUsername("testuser");
    const password = "password";

    await registerPage.register(username, password, password);

    // After success, the site redirects to /login
    await registerPage.expectRedirectedToLogin();

    // Expect flash message to confirm account creation
    await registerPage.expectFlashSuccess(MESSAGES.registerSuccess);
  });

  // ══════════════════════════════════════════════════════════
  // ❌ NEGATIVE TESTS — Form Validation
  // ══════════════════════════════════════════════════════════
  // CONCEPT: "Form Validation Testing" means verifying:
  //   1. Required fields can't be skipped
  //   2. Rules (min length, format) are enforced
  //   3. Error messages are HELPFUL and CORRECT
  //   4. The user stays on the form (not redirected)

  test("TC-R03 | should fail when passwords do not match", async ({ page }) => {
    // CONCEPT: Password mismatch is the #1 register bug companies test.
    // The server OR client should catch this before creating the user.
    const username = uniqueUsername("mismatch");

    await registerPage.register(username, "password", "passwordd");

    // User should still be on register page
    await expect(page).toHaveURL(/register/);

    // Flash error must appear
    await registerPage.expectFlashError(MESSAGES.passwordMismatch);
  });

  test("TC-R04 | should not register with empty username", async ({ page }) => {
    // CONCEPT: HTML5 `required` attribute fires validation
    // before even hitting the server. The form doesn't submit.
    await registerPage.register("", "password", "password");

    // Page stays — browser blocked the submit
    await expect(page).toHaveURL(/register/);
  });

  test("TC-R05 | should not register with empty password", async ({ page }) => {
    const username = uniqueUsername("emptypass");
    await registerPage.register(username, "", "");
    await expect(page).toHaveURL(/register/);
  });

  test("TC-R06 | should not register with empty confirm password", async ({
    page,
  }) => {
    const username = uniqueUsername("emptyconfirm");
    await registerPage.register(username, "Password", "");
    await expect(page).toHaveURL(/register/);
  });
});

// ============================================================
// 🎓 BONUS: Form Validation — Input Interaction Deep Dive
// ============================================================
test.describe("Form Validation — Input Interactions", () => {
  test("TC-FV01 | .fill() vs .type() behavior", async ({ page }) => {
    await page.goto("/login");

    const input = page.getByLabel("Username");

    // .fill() → clears field then pastes the whole value instantly
    // ✅ PREFERRED: Fast, reliable, handles special chars
    await input.fill("practice");

    // Verify the value was set
    // .inputValue() → returns current value of an input
    // 📖 https://playwright.dev/docs/api/class-locator#locator-input-value
    const value = await input.inputValue();
    expect(value).toBe("practice");

    // .clear() → empties the field
    // 📖 https://playwright.dev/docs/api/class-locator#locator-clear
    await input.clear();
    const afterClear = await input.inputValue();
    expect(afterClear).toBe("");

    // .pressSequentially() → types char by char (simulates real user)
    // USE WHEN: the app listens to keydown/keyup events (autocomplete)
    // AVOID: It's slower. Only use when fill() doesn't trigger events.
    // 📖 https://playwright.dev/docs/api/class-locator#locator-press-sequentially
    await input.pressSequentially("practice", { delay: 50 });
    const afterType = await input.inputValue();
    expect(afterType).toBe("practice");
  });

  test("TC-FV02 | keyboard interactions with Tab and Enter", async ({
    page,
  }) => {
    await page.goto("/login");

    // CONCEPT: Some forms respond to keyboard navigation.
    // Tab moves focus, Enter submits. Test these flows.

    const username = page.getByLabel("Username");
    await username.fill("practice");

    // .press() → sends a single key event
    // 'Tab' moves focus to next focusable element
    // 📖 https://playwright.dev/docs/api/class-locator#locator-press
    await username.press("Tab");

    // Now focus should be on password field
    const password = page.getByLabel("Password");
    await password.fill("SuperSecretPassword!");

    // Enter on the last field often submits the form
    await password.press("Enter");

    // Should have submitted and redirected
    await expect(page).toHaveURL(/secure/, { timeout: 5000 });
  });

  test("TC-FV03 | checking element states (enabled/disabled/visible)", async ({
    page,
  }) => {
    await page.goto("/login");

    const loginButton = page.getByRole("button", { name: "Login" });

    // toBeEnabled → button is clickable (not disabled attr)
    // 📖 https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-enabled
    await expect(loginButton).toBeEnabled();

    // toBeVisible → element is in the DOM and not hidden
    // 📖 https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-visible
    await expect(loginButton).toBeVisible();

    // ✅ FIX: Scroll the button into view before asserting toBeInViewport.
    // The page may render with ads/banners pushing content below the fold,
    // so the button exists in the DOM but isn't on screen yet.
    // scrollIntoViewIfNeeded() ensures it's physically visible before we check.
    await loginButton.scrollIntoViewIfNeeded();

    // toBeInViewport → the element is actually visible on screen
    // (not scrolled out of view)
    await expect(loginButton).toBeInViewport();

    // Verify the input type is "password" (shows dots not text)
    const passwordField = page.getByLabel("Password");
    await expect(passwordField).toHaveAttribute("type", "password");
  });

  test("TC-FV04 | soft assertions — continue after failure", async ({
    page,
  }) => {
    // CONCEPT: "Soft assertions" don't stop the test on first failure.
    // Regular expect() → fails → test stops immediately.
    // expect.soft() → fails → records failure but test continues.
    //
    // USE CASE: Checking multiple things on a page at once,
    //           so you see ALL broken things in one run.
    //
    // 📖 https://playwright.dev/docs/test-assertions#soft-assertions
    await page.goto("/login");

    // These all run even if one fails
    await expect.soft(page.getByLabel("Username")).toBeVisible();
    await expect.soft(page.getByLabel("Password")).toBeVisible();
    await expect
      .soft(page.getByRole("button", { name: "Login" }))
      .toBeVisible();

    // If any soft assertion failed, the test is marked failed at the end
    // but you saw all the failures in the report.
  });

  test("TC-FV05 | polling for dynamic content", async ({ page }) => {
    // CONCEPT: Some content loads after a delay (API calls, animations).
    // expect.poll() retries your check until it passes or times out.
    //
    // 📖 https://playwright.dev/docs/test-assertions#polling
    await page.goto("/login");
    await page.getByLabel("Username").fill("practice");
    await page.getByLabel("Password").fill("SuperSecretPassword!");
    await page.getByRole("button", { name: "Login" }).click();

    // poll() keeps calling the function until it returns a truthy value
    // or until the timeout (default 5 seconds)
    await expect
      .poll(
        async () => {
          return await page.url();
        },
        {
          message: 'Expected URL to contain "secure"',
          timeout: 5000,
        },
      )
      .toContain("secure");
  });
});

// ============================================================
// 🎓 FULL AUTH LIFECYCLE TEST
// ============================================================
// This is the "crown jewel" test — register → login → logout.
// It tests three features working together.
//
// CONCEPT: End-to-End (E2E) test = full user journey.
// This is different from unit tests that test one thing.
// ============================================================

test.describe("Full Auth Lifecycle", () => {
  test("TC-AUTH01 | Register → Login → Logout full flow", async ({ page }) => {
    // ── STEP 1: Register a new user ──────────────────────────
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    const username = uniqueUsername("fullflow");
    const password = "password";

    await registerPage.register(username, password, password);
    await registerPage.expectRedirectedToLogin();

    // ── STEP 2: Login with the newly created user ─────────────
    const loginPage = new LoginPage(page);
    // Already on /login from the redirect
    await loginPage.login(username, password);
    await loginPage.expectOnSecurePage();
    await loginPage.expectSuccessMessage(MESSAGES.loginSuccess);

    // ── STEP 3: Logout ────────────────────────────────────────
    await loginPage.logout();
    await expect(page).toHaveURL(/login/);

    // ── STEP 4: Try to access secure area without login ───────
    // CONCEPT: Verify that after logout, the session is gone.
    // This is a SECURITY test — unauthenticated access should fail.
    await page.goto("/secure");

    // Should be redirected back to login (can't access without auth)
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
