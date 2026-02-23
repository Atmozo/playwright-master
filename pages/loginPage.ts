import { Page, Locator, expect } from "@playwright/test";
//=====================================
// Lecture 1: Page Object Model (POM)
// ====================================
// Why POM?

// Without POM: selctors are copy-pasted everywhere.
// One ID changes -> 20 tests files break.
// With POM: selctors are in one place.
// One ID changes -> only one file needs to be updated.
//
// PLAYWRIGHT DOC ON POM: https://playwright.dev/docs/pom
// =====================================

export class LoginPage {
  // -- 1. Store The Page Reference______________
  // Every page object class should have a reference to the Page object.
  // Think of it as the "browser tsb" handle
  readonly page: Page;

  // -- 2. Declare Selectors as Class Properties______________
  // WE  declare them once here so everywhere test methods can use them.
  //
  // WHY getByLable?
  // It targets <label> text -> more resilient than CSS.
  // PLAYWRIGHT DOC ON GETBYLABEL: https://playwright.dev/docs/locators#locating-elements-by-label-text
  //
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly flashMessage: Locator;
  readonly logoutButton: Locator;

  // -- 3. BASE URL________________________
  // // Centralize the URL here so if it changes, we only update one place.
  readonly URL = "/login";

  constructor(page: Page) {
    this.page = page;

    // getByLable -> matches the <label> text associated with the input field.
    this.usernameInput = page.getByLabel("Username");
    this.passwordInput = page.getByLabel("Password");

    // getByRole -> sematic, matches <btn> with accessible name "Login".
    // PLAYWRIGHT DOC ON GETBYROLE: https://playwright.dev/docs/locators#locating-elements-by-role
    this.loginButton = page.getByRole("button", { name: "Login" });

    // #flash is the Bootstrap alert div for success/error messages.
    this.flashMessage = page.locator("#flash");

    //On the secure page after login
    this.logoutButton = page.getByRole("link", { name: "Logout" });
  }

  // -- 4. Methods to Interact with the Page________________________
  // Keep actions in the Page Object , Not int he test file.
  // Tests stay readable: "LoginPage.login('user', 'pass')"
  //
  async goto() {
    await this.page.goto(this.URL);
  }

  async fillUsername(username: string) {
    //.fill() clears the field before typing. better than .type() for speed
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  // --COMPOSED Actions________________________
  // Higher level methods that combine multiple steps.
  // If the flow chages, fix it here, not in every test.
  async login(username: string, password: string) {
    await this.goto();
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  // ── 5. ASSERTION HELPERS ─────────────────────────────────
  // Some teams put assertions in the page object as helpers.
  // Keeps the test file slim and the intent crystal-clear.
  //
  // 📖 PLAYWRIGHT DOC on assertions:
  //   https://playwright.dev/docs/test-assertions

  async expectSuccessMessage(text: string) {
    await expect(this.flashMessage).toBeVisible();
    await expect(this.flashMessage).toContainText(text);
  }

  async expectErrorMessage(text: string) {
    await expect(this.flashMessage).toBeVisible();
    await expect(this.flashMessage).toContainText(text);
  }

  async expectOnSecurePage() {
    // toHaveURL checks the browser address bar
    // PLAYWRIGHT DOC: https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-url
    await expect(this.page).toHaveURL(/secure/);
    await expect(this.logoutButton).toBeVisible();
  }

  async logout() {
    await this.logoutButton.click();
    await expect(this.page).toHaveURL(/login/);
  }
}
