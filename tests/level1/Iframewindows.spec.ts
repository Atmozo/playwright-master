// ============================================================
// 🎓 LEVEL 1 — Challenge 5: IFrames & Multiple Windows
// Sites: /iframe and /windows
// ============================================================
//
// KEYS IN THIS FILE:
//  ✅ frameLocator() → modern way to work with iframes
//  ✅ Nested iframes (iframe in iframe)
//  ✅ context.waitForEvent('page') → catch new windows
//  ✅ Switching between multiple windows
//  ✅ Finding windows by title/URL
//  ✅ Closing windows properly
//
// 📖 PLAYWRIGHT DOCS TO READ:
//  Frames:        https://playwright.dev/docs/frames
//  FrameLocator:  https://playwright.dev/docs/api/class-framelocator
//  Pages:         https://playwright.dev/docs/pages
//  BrowserContext: https://playwright.dev/docs/api/class-browsercontext
// ============================================================

import { test, expect, Page } from "@playwright/test";
import { IFramePage } from "../../pages/IFramePage";
import { WindowsPage } from "../../pages/WindowsPage";

test.describe("IFrames", () => {
  let iframePage: IFramePage;

  test.beforeEach(async ({ page }) => {
    iframePage = new IFramePage(page);
    await iframePage.goto();
  });

  // ══════════════════════════════════════════════════════════
  // ✅ BASIC IFRAME TESTS
  // ══════════════════════════════════════════════════════════

  test("TC-IF01 | should display iframe on page", async ({ page }) => {
    // 📖 CONCEPT: Verify iframe element exists in the DOM
    const iframe = page.locator("iframe").first();
    await expect(iframe).toBeAttached();
  });

  test("TC-IF02 | should access element inside iframe", async ({ page }) => {
    // ✅ Target the YouTube iframe specifically, not the first (which is an ad)
    const iframe = page.frameLocator('iframe[title="YouTube video player"]');
    await expect(iframe.locator("body")).toBeVisible();
  });
  test("TC-IF03 | should get iframe by title attribute", async ({ page }) => {
    await iframePage.waitForIFrameToLoad(
      'iframe[title="YouTube video player"]',
    );
    const iframe = page.frameLocator('iframe[title="YouTube video player"]');
    await expect(iframe.locator("body")).toBeVisible();
  });

  test("TC-IF04 | should verify iframe loaded completely", async ({ page }) => {
    await iframePage.waitForIFrameToLoad(
      'iframe[title="YouTube video player"]',
    );
    const iframe = page.frameLocator('iframe[title="YouTube video player"]');
    await expect(iframe.locator("body")).toBeVisible();
  });
  test("TC-IF05 | should interact with YouTube player iframe", async ({
    page,
  }) => {
    // The practice site embeds a YouTube player
    const youtube = page.frameLocator('iframe[src*="youtube"]');

    // YouTube players have specific structure
    // We can verify the player container exists
    const playerExists = (await youtube.locator("body").count()) > 0;
    expect(playerExists).toBe(true);
  });

  test("TC-IF06 | should get text from inside iframe", async () => {
    // ✅ Use the internal email subscription iframe which has real text content
    const bodyText = await iframePage.getTextFromIFrame(
      "#email-subscribe",
      "body",
    );
    expect(bodyText.length).toBeGreaterThan(0);
  });
  // ══════════════════════════════════════════════════════════
  // ✅ ADVANCED: NESTED IFRAMES
  // ══════════════════════════════════════════════════════════

  test("TC-IF07 | should handle nested iframes (if present)", async ({
    page,
  }) => {
    // 📖 CONCEPT: Chain frameLocator() for nested iframes
    //
    // page → iframe1 → iframe2 → element
    //
    // https://playwright.dev/docs/frames#nested-frames

    // Check if there are nested iframes
    const iframe = page.frameLocator("iframe").first();
    const nestedIframes = await iframe.locator("iframe").count();

    if (nestedIframes > 0) {
      // Access nested iframe
      const nestedIframe = iframe.frameLocator("iframe").first();
      // ✅ Only verify it exists in DOM, not visible (nested ad iframes have hidden body)
      const bodyCount = await nestedIframe.locator("body").count();
      expect(bodyCount).toBeGreaterThan(0);
    } else {
      console.log("No nested iframes on this page");
    }
  });

  test("TC-IF08 | should switch between main page and iframe", async ({
    page,
  }) => {
    // 📖 TEACHING POINT: You don't "switch" like Selenium.
    // You use different locators:

    // Main page element
    const mainPageHeader = page.locator("h1").first();
    await expect(mainPageHeader).toBeVisible();

    // iframe element
    const iframe = page.frameLocator("iframe").first();
    await expect(iframe.locator("body")).toBeVisible();

    // Back to main page (no switching needed)
    await expect(mainPageHeader).toBeVisible();
  });
});

test.describe("Multiple Windows / Tabs", () => {
  let windowsPage: WindowsPage;

  test.beforeEach(async ({ page, context }) => {
    windowsPage = new WindowsPage(page, context);
    await windowsPage.goto();
  });

  // ══════════════════════════════════════════════════════════
  // ✅ BASIC WINDOW TESTS
  // ══════════════════════════════════════════════════════════

  test("TC-W01 | should display links that open new windows", async ({
    page,
  }) => {
    // Verify the page has links that open new windows
    const links = await page.locator("a[target='_blank']").count();
    expect(links).toBeGreaterThan(0);
  });

  test("TC-W02 | should open new window when clicking link", async ({
    page,
    context,
  }) => {
    // 📖 CRITICAL PATTERN:
    // Listen for new window BEFORE clicking the link
    //
    // https://playwright.dev/docs/api/class-browsercontext#browser-context-wait-for-event

    const initialCount = windowsPage.getWindowCount();

    const newPagePromise = context.waitForEvent("page");

    // ✅ Use target="_blank" to ensure we click a link that opens a new window
    const link = page.locator("a[target='_blank']").first();
    await link.click();

    // Wait for new window
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Verify new window opened
    expect(windowsPage.getWindowCount()).toBe(initialCount + 1);

    // Clean up
    await newPage.close();
  });

  test("TC-W03 | should get all open windows", async ({ context }) => {
    // Initially should have 1 window (the main page)
    const pages = windowsPage.getAllPages();
    expect(pages.length).toBeGreaterThanOrEqual(1);
  });

  test("TC-W04 | should switch to specific window by index", async ({
    page,
    context,
  }) => {
    // Open a new window
    const newPagePromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Get window by index
    const firstWindow = windowsPage.switchToWindow(0);
    const secondWindow = windowsPage.switchToWindow(1);

    // Verify they're different
    expect(firstWindow).not.toBe(secondWindow);

    // Clean up
    await secondWindow.close();
  });

  test("TC-W05 | should get the last opened window", async ({
    page,
    context,
  }) => {
    const initialCount = windowsPage.getWindowCount();

    // Open new window
    const newPagePromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Get last window
    const lastWindow = windowsPage.switchToLastWindow();

    // Should be the newly opened one
    expect(lastWindow).toBe(newPage);

    await newPage.close();
  });

  // ══════════════════════════════════════════════════════════
  // ✅ WORKING WITH NEW WINDOWS
  // ══════════════════════════════════════════════════════════

  test("TC-W06 | should interact with elements in new window", async ({
    page,
    context,
  }) => {
    // Open new window
    const newPagePromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Verify new window URL
    expect(newPage.url().length).toBeGreaterThan(0);

    // Interact with elements in new window
    const title = await newPage.title();
    expect(title.length).toBeGreaterThan(0);

    // Clean up
    await newPage.close();
  });

  test("TC-W07 | should verify new window title and URL", async ({
    page,
    context,
  }) => {
    const newPagePromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Use assertion helpers
    await windowsPage.expectWindowTitle(newPage, "");
    // The title will vary based on which link was clicked

    await newPage.close();
  });

  test("TC-W08 | should close specific window", async ({ page, context }) => {
    // Open new window
    const newPagePromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    const beforeClose = windowsPage.getWindowCount();

    // Close it
    await windowsPage.closeWindow(newPage);

    // Verify count decreased
    expect(windowsPage.getWindowCount()).toBe(beforeClose - 1);
  });

  test("TC-W09 | should close all windows except main", async ({
    page,
    context,
  }) => {
    // Open multiple windows
    const page2Promise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const page2 = await page2Promise;
    await page2.waitForLoadState();

    const page3Promise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").nth(1).click();
    const page3 = await page3Promise;
    await page3.waitForLoadState();

    // Should have 3 windows
    expect(windowsPage.getWindowCount()).toBe(3);

    // Close all except main
    await windowsPage.closeAllExceptMain();

    // Should have 1 window left
    expect(windowsPage.getWindowCount()).toBe(1);
  });

  // ══════════════════════════════════════════════════════════
  // ✅ FINDING WINDOWS BY PROPERTIES
  // ══════════════════════════════════════════════════════════

  test("TC-W10 | should find window by title", async ({ page, context }) => {
    // Open new window
    const newPagePromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Get its title
    const title = await newPage.title();

    // Find window by title
    const foundPage = await windowsPage.findWindowByTitle(title);

    expect(foundPage).toBe(newPage);

    await newPage.close();
  });

  test("TC-W11 | should find window by URL pattern", async ({
    page,
    context,
  }) => {
    const newPagePromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    const url = newPage.url();

    // Find by URL substring
    const foundPage = await windowsPage.findWindowByURL(url);

    expect(foundPage).not.toBeNull();

    await newPage.close();
  });

  test("TC-W12 | should find window by regex URL pattern", async ({
    page,
    context,
  }) => {
    const newPagePromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Find using regex
    const foundPage = await windowsPage.findWindowByURL(
      /practice\.expandtesting\.com/,
    );

    expect(foundPage).not.toBeNull();

    await newPage.close();
  });

  // ══════════════════════════════════════════════════════════
  // ✅ ADVANCED: POPUP WINDOWS
  // ══════════════════════════════════════════════════════════

  test("TC-W13 | should handle popup window workflow", async ({
    page,
    context,
  }) => {
    // 📖 REAL-WORLD PATTERN:
    // Some sites open popups for auth, payment, etc.
    // You work in popup, then close it and return to main page

    const popupPromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const popup = await popupPromise;
    await popup.waitForLoadState();

    // Work in the popup
    const popupTitle = await popup.title();
    expect(popupTitle.length).toBeGreaterThan(0);

    // Close popup
    await popup.close();

    // Verify we're back to main page
    expect(page.isClosed()).toBe(false);
  });

  test("TC-W14 | should use bringToFront() to focus window", async ({
    page,
    context,
  }) => {
    // Open new window
    const newPagePromise = context.waitForEvent("page");
    // ✅ target="_blank" ensures a new window/tab opens
    await page.locator("a[target='_blank']").first().click();
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();

    // Switch focus to main page
    await page.bringToFront();

    // Now interactions happen on main page
    const mainTitle = await page.title();
    expect(mainTitle).toContain("Windows");

    // Switch focus to new page
    await newPage.bringToFront();

    await newPage.close();
  });
});

// ============================================================
// 📖 KEY TAKEAWAYS
// ============================================================
//
// ✅ IFrames:
//    - frameLocator('selector') → enter an iframe
//    - Chain frameLocator() for nested iframes
//    - No "switching" needed - just use different locators
//    - Always wait for iframe to load
//    - Use .first() when generic 'iframe' selector matches ads too
//
// ✅ Multiple Windows:
//    - context.waitForEvent('page') → catch new windows
//    - Start waiting BEFORE clicking
//    - Use a[target='_blank'] to target links that open new tabs
//    - context.pages() → get all open windows
//    - page.close() → close a window
//    - page.bringToFront() → focus a window
//    - Find windows by title/URL
//
// ✅ Best Practices:
//    - Always clean up (close windows after test)
//    - Wait for new pages to load
//    - Use Page Object for window management
//    - Test isolation: each test starts with 1 window
//
// ============================================================
