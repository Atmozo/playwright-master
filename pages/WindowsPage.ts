import { Page, BrowserContext, expect } from "@playwright/test";

// ============================================================
// 📖 LECTURE: Multiple Windows/Tabs Page Object
// ============================================================
// WHAT YOU'LL LEARN:
//  - context.waitForEvent('page') → catch new windows/tabs
//  - Switching between windows
//  - Closing windows
//  - Window handles management
//  - Testing "open in new tab" flows
//
// PLAYWRIGHT DOCS:
//   https://playwright.dev/docs/pages
//   https://playwright.dev/docs/api/class-browsercontext#browser-context-wait-for-event
// ============================================================

export class WindowsPage {
  readonly page: Page;
  readonly context: BrowserContext;

  readonly URL = "/windows";

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }

  async goto() {
    await this.page.goto(this.URL);
  }

  // ── NEW WINDOW HANDLING METHODS ──────────────────────────

  // Click a link that opens in a new tab/window
  // Returns the new page object
  async clickLinkOpeningNewWindow(linkText: string): Promise<Page> {
    // 📖 CRITICAL PATTERN:
    // Start listening for the new page BEFORE clicking the link.
    // context.waitForEvent('page') → waits for a new page to open
    //
    // https://playwright.dev/docs/api/class-browsercontext#browser-context-wait-for-event
    const newPagePromise = this.context.waitForEvent("page");

    // Click the link that has target="_blank"
    await this.page.getByRole("link", { name: linkText }).click();

    // Wait for the new page to open
    const newPage = await newPagePromise;

    // Wait for the new page to fully load
    await newPage.waitForLoadState("domcontentloaded");

    return newPage;
  }

  // Get all open pages (windows/tabs)
  getAllPages(): Page[] {
    return this.context.pages();
  }

  // Get count of open windows
  getWindowCount(): number {
    return this.context.pages().length;
  }

  // Switch to a specific page by index
  switchToWindow(index: number): Page {
    const pages = this.context.pages();
    if (index >= pages.length) {
      throw new Error(`Window ${index} does not exist`);
    }
    return pages[index];
  }

  // Switch to last opened window
  switchToLastWindow(): Page {
    const pages = this.context.pages();
    return pages[pages.length - 1];
  }

  // Close a specific window
  async closeWindow(page: Page) {
    await page.close();
  }

  // Close all windows except the main one
  async closeAllExceptMain() {
    const pages = this.context.pages();
    const mainPage = pages[0]; // First page is usually the main one

    for (const page of pages) {
      if (page !== mainPage) {
        await page.close();
      }
    }
  }

  // Find window by title
  async findWindowByTitle(title: string): Promise<Page | null> {
    const pages = this.context.pages();

    for (const page of pages) {
      const pageTitle = await page.title();
      if (pageTitle.includes(title)) {
        return page;
      }
    }

    return null;
  }

  // Find window by URL
  async findWindowByURL(urlPattern: string | RegExp): Promise<Page | null> {
    const pages = this.context.pages();

    for (const page of pages) {
      const url = page.url();
      if (typeof urlPattern === "string") {
        if (url.includes(urlPattern)) return page;
      } else {
        if (urlPattern.test(url)) return page;
      }
    }

    return null;
  }

  // ── ASSERTIONS ───────────────────────────────────────────

  async expectWindowCount(expectedCount: number) {
    // Use expect.poll for dynamic window count
    await expect.poll(() => this.getWindowCount()).toBe(expectedCount);
  }

  async expectNewWindowOpened(initialCount: number) {
    await expect
      .poll(() => this.getWindowCount())
      .toBeGreaterThan(initialCount);
  }

  async expectWindowTitle(page: Page, expectedTitle: string) {
    await expect(page).toHaveTitle(new RegExp(expectedTitle));
  }

  async expectWindowURL(page: Page, expectedURL: string | RegExp) {
    await expect(page).toHaveURL(expectedURL);
  }
}

// ============================================================
// 📖 MULTIPLE WINDOWS CONCEPTS
// ============================================================
//
// CONCEPT 1: BrowserContext vs Page
// ──────────────────────────────────
// CONCEPT 2: When a new window opens
// ───────────────────────────────────
// ============================================================
// 📖 COMMON PATTERNS
// ============================================================
//
// Pattern 1: Click link, work in new tab, close it
// ─────────────────────────────────────────────────
// Pattern 2: Verify external link opens correct domain
// ─────────────────────────────────────────────────────
// Pattern 3: Handle popup window
// ───────────────────────────────
// Pattern 4: Multiple windows workflow
// ─────────────────────────────────────
// Pattern 5: Download from new window
// ────────────────────────────────────
// ============================================================
// 🚨 COMMON PITFALLS
// ============================================================
//
// ❌ MISTAKE 1: Not waiting for new page
// ───────────────────────────────────────
// await page.click('a[target="_blank"]');
// const newPage = context.pages()[1];  // ❌ Might be undefined!
// await newPage.click('#button');      // ❌ Error!
//
// ✅ CORRECT:
// const newPagePromise = context.waitForEvent('page');
// await page.click('a[target="_blank"]');
// const newPage = await newPagePromise;  // ✅ Guaranteed to exist
// await newPage.waitForLoadState();
//
// ❌ MISTAKE 2: Working in wrong window
// ──────────────────────────────────────
// await page1.click('#button');  // You think you're in page1
// // But the test is actually looking at page2 now
//
// ✅ CORRECT:
// await page1.bringToFront();  // Explicitly switch focus
// await page1.click('#button');
//
// ❌ MISTAKE 3: Not closing windows after test
// ─────────────────────────────────────────────
// test('multiple windows', async ({ page, context }) => {
//   const page2 = await context.newPage();
//   const page3 = await context.newPage();
//   // ... test logic ...
//   // ❌ Didn't close page2, page3 → they leak into next test!
// });
//
// ✅ CORRECT:
// test('multiple windows', async ({ page, context }) => {
//   const page2 = await context.newPage();
//   const page3 = await context.newPage();
//   // ... test logic ...
//   await page2.close();
//   await page3.close();  // ✅ Clean up
// });
//
// ============================================================
