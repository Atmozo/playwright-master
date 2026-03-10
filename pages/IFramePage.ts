import { Page, Locator, FrameLocator, expect } from "@playwright/test";

// ============================================================
//  LECTURE: IFrame Page Object
// ============================================================
// KEYS INIT:
//  - frameLocator() → enter an iframe
//  - Interacting with nested iframes
//  - Switching between frame and main page
//  - Waiting for frame to load
//  - Common iframe pitfalls
//
// PLAYWRIGHT DOCS:
//   https://playwright.dev/docs/frames
//   https://playwright.dev/docs/api/class-framelocator
// ============================================================

export class IFramePage {
  readonly page: Page;

  readonly URL = "/iframe";

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(this.URL);
  }

  // ── IFRAME ACCESS METHODS ────────────────────────────────

  // Get the iframe by selector
  //  CRITICAL: frameLocator() is the MODERN way to work with iframes.
  // Old way: page.frame('name') or page.frames()[0]
  // New way: page.frameLocator('selector')
  //
  // https://playwright.dev/docs/api/class-page#page-frame-locator
  getIFrameBySelector(selector: string): FrameLocator {
    return this.page.frameLocator(selector);
  }

  // Get iframe by name attribute
  getIFrameByName(name: string): FrameLocator {
    return this.page.frameLocator(`iframe[name="${name}"]`);
  }

  // Get iframe by title attribute
  getIFrameByTitle(title: string): FrameLocator {
    return this.page.frameLocator(`iframe[title="${title}"]`);
  }

  // Get the first iframe on the page
  getFirstIFrame(): FrameLocator {
    return this.page.frameLocator("iframe").first();
  }

  // ── IFRAME INTERACTION METHODS ───────────────────────────

  // Type text in an input inside iframe
  async fillInputInIFrame(
    iframeSelector: string,
    inputSelector: string,
    text: string,
  ) {
    const iframe = this.getIFrameBySelector(iframeSelector);

    //  CRITICAL: After getting frameLocator(), you use normal locators inside
    // iframe.locator('input') → finds input INSIDE the iframe
    await iframe.locator(inputSelector).fill(text);
  }

  // Click button inside iframe
  async clickInIFrame(iframeSelector: string, buttonText: string) {
    const iframe = this.getIFrameBySelector(iframeSelector);
    await iframe.getByRole("button", { name: buttonText }).click();
  }

  // Get text from element inside iframe
  async getTextFromIFrame(
    iframeSelector: string,
    selector: string,
  ): Promise<string> {
    //  Use .first() to avoid strict mode violation when multiple iframes match
    const iframe = this.page.frameLocator(iframeSelector).first();
    return (await iframe.locator(selector).textContent()) || "";
  }

  // ── NESTED IFRAME METHODS ────────────────────────────────
  // Some pages have iframes INSIDE iframes.
  // You chain frameLocator() calls.

  async interactWithNestedIFrame(
    outerIframeSelector: string,
    innerIframeSelector: string,
    elementSelector: string,
  ) {
    //  CHAINING: page → outer iframe → inner iframe → element
    const outerFrame = this.page.frameLocator(outerIframeSelector);
    const innerFrame = outerFrame.frameLocator(innerIframeSelector);
    await innerFrame.locator(elementSelector).click();
  }

  // ── ASSERTIONS ───────────────────────────────────────────

  async expectIFrameVisible(iframeSelector: string) {
    // The iframe element itself should be in the DOM
    await expect(this.page.locator(iframeSelector).first()).toBeVisible(); //  .first()
  }

  async expectElementInIFrame(iframeSelector: string, elementSelector: string) {
    const iframe = this.getIFrameBySelector(iframeSelector);
    await expect(iframe.locator(elementSelector)).toBeVisible();
  }

  async expectTextInIFrame(iframeSelector: string, expectedText: string) {
    const iframe = this.getIFrameBySelector(iframeSelector);
    await expect(iframe.locator("body")).toContainText(expectedText);
  }

  // Wait for iframe to fully load
  async waitForIFrameToLoad(iframeSelector: string) {
    //  Use .first() to avoid strict mode violation — ads inject many iframes
    await this.page
      .locator(iframeSelector)
      .first()
      .waitFor({ state: "attached" });

    // Additional wait for content to load (iframe's body tag)
    const iframe = this.page.frameLocator(iframeSelector).first();
    await iframe.locator("body").waitFor({ state: "visible" });
  }
}

// ============================================================
//  IFRAME CONCEPTS & COMMON MISTAKES
// ============================================================
//
//  MISTAKE 1: Not switching into the iframe
// ────────────────────────────────────────────
// await page.click('#button-in-iframe');  //  Won't work!
// // Playwright looks in main page, not inside iframe
//
//  CORRECT:
// const iframe = page.frameLocator('#my-iframe');
// await iframe.locator('#button-in-iframe').click();  //  Works!
//
//  MISTAKE 2: Using deprecated page.frame()
// ───────────────────────────────────────────
// const frame = page.frame('frameName');  //  Old API
// await frame.click('#button');
//
//  CORRECT (modern way):
// const iframe = page.frameLocator('iframe[name="frameName"]');
// await iframe.locator('#button').click();
//
//  MISTAKE 3: Not waiting for iframe to load
// ─────────────────────────────────────────────
// await page.goto('/page-with-iframe');
// const iframe = page.frameLocator('iframe');
// await iframe.click('#button');  //  Might fail if iframe still loading
//
//  CORRECT:
// await page.goto('/page-with-iframe');
// const iframe = page.frameLocator('iframe');
// await iframe.locator('body').waitFor();  // Wait for iframe content
// await iframe.click('#button');
//
//  MISTAKE 4: Not using .first() when multiple iframes match
// ─────────────────────────────────────────────────────────────
// await page.locator('iframe').waitFor();  //  Strict mode: matches 10+ iframes (ads!)
//
//  CORRECT:
// await page.locator('iframe').first().waitFor();  // Targets first match only
//
// ============================================================
//  REAL-WORLD IFRAME PATTERNS
// ============================================================
//
// Pattern 1: YouTube embed
// ────────────────────────
// Pattern 2: Rich text editor (TinyMCE, CKEditor)
// ───────────────────────────────────────────────
// Pattern 3: Payment gateway (Stripe, PayPal)
// ────────────────────────────────────────────
// Pattern 4: Google reCAPTCHA
// ───────────────────────────
// Pattern 5: Nested iframes (iframe in iframe)
// ─────────────────────────────────────────────
// ============================================================
