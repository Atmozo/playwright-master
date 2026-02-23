// ============================================================
// 🎓 BONUS: Drag & Drop (Level 2 Preview)
// Site: /drag-and-drop
// ============================================================
//
// KEYS INIT:
//  ✅ dragTo() → the modern drag-drop method
//  ✅ Manual mouse drag (when dragTo fails)
//  ✅ HTML5 drag-drop events
//  ✅ Verifying drag-drop success
//  ✅ Troubleshooting drag-drop issues
//
// 📖 PLAYWRIGHT DOCS TO READ:
//  Dragging:     https://playwright.dev/docs/input#dragging
//  Mouse:        https://playwright.dev/docs/api/class-mouse
//  dragTo():     https://playwright.dev/docs/api/class-locator#locator-drag-to
// ============================================================

import { test, expect } from "@playwright/test";
import { DragDropPage } from "../../pages/DragDropPage";

test.describe("Drag & Drop", () => {
  let dragDropPage: DragDropPage;

  test.beforeEach(async ({ page }) => {
    dragDropPage = new DragDropPage(page);
    await dragDropPage.goto();
  });

  // ══════════════════════════════════════════════════════════
  // ✅ BASIC DRAG & DROP
  // ══════════════════════════════════════════════════════════

  test("TC-DD01 | should display drag-drop elements", async () => {
    // Verify both columns exist
    await expect(dragDropPage.columnA).toBeVisible();
    await expect(dragDropPage.columnB).toBeVisible();

    // Verify initial state
    await dragDropPage.expectOriginalState();
  });

  test("TC-DD02 | should drag column A to column B", async () => {
    // 📖 CONCEPT: dragTo() is Playwright's built-in drag-drop method
    // It handles all the mouse events automatically
    //
    // https://playwright.dev/docs/api/class-locator#locator-drag-to

    // Initial state: A in left, B in right
    await dragDropPage.expectColumnAText("A");
    await dragDropPage.expectColumnBText("B");

    // Perform drag-drop
    await dragDropPage.dragAtoB();

    // After swap: B in left, A in right
    await dragDropPage.expectColumnAText("B");
    await dragDropPage.expectColumnBText("A");
  });

  test("TC-DD03 | should drag column B to column A", async () => {
    // Start with swapped state (from previous drag)
    await dragDropPage.dragAtoB();
    await dragDropPage.expectSwapped();

    // Drag back
    await dragDropPage.dragBtoA();

    // Should be back to original
    await dragDropPage.expectOriginalState();
  });

  test("TC-DD04 | should drag multiple times", async () => {
    // Drag A to B
    await dragDropPage.dragAtoB();
    await dragDropPage.expectSwapped();

    // Drag B to A (swap back)
    await dragDropPage.dragBtoA();
    await dragDropPage.expectOriginalState();

    // Drag A to B again
    await dragDropPage.dragAtoB();
    await dragDropPage.expectSwapped();
  });

  test("TC-DD05 | should verify text content after drag", async () => {
    // Get text before drag
    const textABefore = await dragDropPage.getColumnAText();
    const textBBefore = await dragDropPage.getColumnBText();

    // Perform drag
    await dragDropPage.dragAtoB();

    // Get text after drag
    const textAAfter = await dragDropPage.getColumnAText();
    const textBAfter = await dragDropPage.getColumnBText();

    // Verify they swapped
    expect(textAAfter.trim()).toBe(textBBefore.trim());
    expect(textBAfter.trim()).toBe(textABefore.trim());
  });

  // ══════════════════════════════════════════════════════════
  // ✅ ALTERNATIVE DRAG-DROP METHODS
  // ══════════════════════════════════════════════════════════

  test("TC-DD06 | should drag using manual mouse movements", async ({
    page,
  }) => {
    await dragDropPage.expectOriginalState();

    // ✅ Close any overlays and scroll columns into view
    await page.keyboard.press("Escape");
    await dragDropPage.columnA.scrollIntoViewIfNeeded();

    await dragDropPage.manualDragDrop(
      dragDropPage.columnA,
      dragDropPage.columnB,
    );
    await dragDropPage.expectSwapped();
  });
  test("TC-DD07 | should use dragTo with options", async () => {
    // dragTo() accepts options for fine-tuning
    await dragDropPage.columnA.dragTo(dragDropPage.columnB, {
      // Drop at specific position in target
      targetPosition: { x: 50, y: 50 },
      // Force the drag even if element is covered
      force: false,
      // How long to wait before releasing
      timeout: 5000,
    });

    await dragDropPage.expectSwapped();
  });

  test("TC-DD08 | should handle HTML5 drag-drop", async () => {
    // 📖  POINT: Some sites use HTML5 DataTransfer API
    // If dragTo() fails, try this method

    await dragDropPage.expectOriginalState();

    await dragDropPage.html5DragDrop(
      dragDropPage.columnA,
      dragDropPage.columnB,
    );

    // Note: This might not work on all sites
    // It depends on how the site implements drag-drop
  });

  // ══════════════════════════════════════════════════════════
  // ✅ EDGE CASES & ERROR HANDLING
  // ══════════════════════════════════════════════════════════

  test("TC-DD09 | should handle drag on same element", async () => {
    // Try to drag A to A (nothing should happen)
    const before = await dragDropPage.getColumnAText();

    await dragDropPage.columnA.dragTo(dragDropPage.columnA);

    const after = await dragDropPage.getColumnAText();

    // Text should remain the same
    expect(after).toBe(before);
  });

  test("TC-DD10 | should verify drag-drop is enabled", async ({ page }) => {
    const columnA = dragDropPage.columnA;
    await expect(columnA).toBeVisible();

    // ✅ hover first to stabilise before drag
    await columnA.hover();
    await page.waitForTimeout(100);
    await dragDropPage.dragAtoB();
    await dragDropPage.expectSwapped();
  });
  test("TC-DD11 | should use hover before drag", async ({ page }) => {
    // 📖 TIP: Sometimes hovering first helps with flaky drag-drop

    // Hover over source element
    await dragDropPage.columnA.hover();
    await page.waitForTimeout(100);

    // Then drag
    await dragDropPage.dragAtoB();

    await dragDropPage.expectSwapped();
  });

  test("TC-DD12 | should add delay between drag steps", async ({ page }) => {
    const source = dragDropPage.columnA;
    const target = dragDropPage.columnB;

    // ✅ Dismiss ad and wait until it's actually gone
    await page.keyboard.press("Escape");
    await source.scrollIntoViewIfNeeded();
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector(
            'iframe[id*="ad"], ins, #google_ads_iframe, [id*="aswift"]',
          );
          return !el || (el as HTMLElement).offsetParent === null;
        },
        { timeout: 5000 },
      )
      .catch(() => {}); // don't fail if no ad found

    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    if (sourceBox && targetBox) {
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2,
        { steps: 10 },
      );
      await page.waitForTimeout(100);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height / 2,
        { steps: 20 },
      );
      await page.waitForTimeout(100);
      await page.mouse.up();
    }

    await dragDropPage.expectSwapped();
  });
  // ══════════════════════════════════════════════════════════
  // ✅ ACCESSIBILITY TESTING
  // ══════════════════════════════════════════════════════════

  test("TC-DD13 | should verify keyboard accessibility", async ({ page }) => {
    // 📖 BEST PRACTICE: Drag-drop should work with keyboard too
    // (Space to grab, arrow keys to move, Enter to drop)

    // This is an advanced topic - most drag-drop is mouse-only
    // But accessible drag-drop should support keyboard

    // Focus on column A
    await dragDropPage.columnA.focus();

    // This test would need keyboard drag-drop support in the app
    console.log("Keyboard drag-drop would be tested here if supported");
  });
});

// ============================================================
// 📖 SUMMARY
// ============================================================
//
// ✅ Drag & Drop Methods:
//    - dragTo() → easiest, works 90% of time
//    - Manual mouse → when dragTo() fails
//    - HTML5 drag-drop → for older implementations
//
// ✅ Troubleshooting:
//    - Add { force: true } if element is covered
//    - Use hover() before drag for flaky tests
//    - Add delays for slow animations
//    - Try manual mouse if dragTo() fails
//
// ✅ Best Practices:
//    - Always verify before/after state
//    - Test multiple drag operations
//    - Consider keyboard accessibility
//    - Use Page Object for drag logic
//
// ============================================================
