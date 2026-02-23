import { Page, Locator, expect } from "@playwright/test";

// ============================================================
// 📖 LECTURE: Register Page Object
// ============================================================
// Same POM pattern as LoginPage — notice how identical the
// structure is. This is the POWER of POM: consistent,
// predictable, easy to onboard new teammates.
//
// NEW CONCEPT HERE: Form Validation (Bootstrap / JS)
//
// The register page uses HTML5 + JS validation.
// We test NEGATIVE paths — what happens when the user sends
// bad data. This is called "negative testing."
//
// 📖 PLAYWRIGHT DOC - Input filling:
//   https://playwright.dev/docs/input
// ============================================================

export class RegisterPage {
  readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly flashMessage: Locator;

  readonly URL = "/register";

  constructor(page: Page) {
    this.page = page;

    // The register form labels match exactly what's on screen
    this.usernameInput = page.getByLabel("Username");
    this.passwordInput = page.getByLabel("Password", { exact: true });
    // ↑ exact: true → avoids matching "Confirm Password" label too
    //   PLAYWRIGHT DOC: https://playwright.dev/docs/locators#filtering-locators

    this.confirmPasswordInput = page.getByLabel("Confirm Password");
    this.registerButton = page.getByRole("button", { name: "Register" });
    this.flashMessage = page.locator("#flash");
  }

  async goto() {
    await this.page.goto(this.URL);
  }

  // ── HIGH-LEVEL ACTION ────────────────────────────────────
  async register(username: string, password: string, confirm: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirm);
    await this.registerButton.click();
  }

  // ── VALIDATION HELPERS ───────────────────────────────────

  // Checks browser HTML5 native validation state
  // (the red border when required field is empty)
  //
  // 📖 PLAYWRIGHT DOC - toHaveAttribute:
  //   https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-attribute
  async expectFieldRequired(locator: Locator) {
    await expect(locator).toHaveAttribute("required");
  }

  // Custom JS/Bootstrap validation messages appear in #flash
  async expectFlashError(text: string) {
    await expect(this.flashMessage).toBeVisible();
    await expect(this.flashMessage).toContainText(text);
  }

  async expectFlashSuccess(text: string) {
    await expect(this.flashMessage).toBeVisible();
    await expect(this.flashMessage).toContainText(text);
  }

  // After successful registration, the site redirects to login
  async expectRedirectedToLogin() {
    await expect(this.page).toHaveURL(/login/);
  }
}
