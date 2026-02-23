import { Page, Locator, expect } from "@playwright/test";

// ============================================================
// 📖 LECTURE: Drag & Drop Page Object
// ============================================================
// KEYS INIT:
//  - dragTo() → the modern drag-drop method
//  - Mouse events (hover, down, move, up)
//  - HTML5 drag-drop vs mouse-based
//  - Verifying drag-drop success
//
// PLAYWRIGHT DOCS:
//   https://playwright.dev/docs/input#dragging
//   https://playwright.dev/docs/api/class-locator#locator-drag-to
// ============================================================

export class DragDropPage {
  readonly page: Page;

  // Drag source and drop target
  readonly columnA: Locator;
  readonly columnB: Locator;

  readonly URL = "/drag-and-drop";

  constructor(page: Page) {
    this.page = page;

    // These are the drag source and drop target
    this.columnA = page.locator("#column-a");
    this.columnB = page.locator("#column-b");
  }

  async goto() {
    await this.page.goto(this.URL);
  }

  // ── DRAG & DROP METHODS ──────────────────────────────────

  // Method 1: dragTo() - PREFERRED (Playwright's built-in)
  // 📖 https://playwright.dev/docs/api/class-locator#locator-drag-to
  async dragToTarget(source: Locator, target: Locator) {
    // This is the EASIEST way in Playwright
    // It handles all the mouse events automatically
    await source.dragTo(target);
  }

  // Drag column A to column B
  async dragAtoB() {
    await this.columnA.dragTo(this.columnB);
  }

  // Drag column B to column A
  async dragBtoA() {
    await this.columnB.dragTo(this.columnA);
  }

  async manualDragDrop(source: Locator, target: Locator) {
    await source.scrollIntoViewIfNeeded();
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    if (!sourceBox || !targetBox)
      throw new Error("Elements not visible for drag-drop");

    const sourceX = sourceBox.x + sourceBox.width / 2;
    const sourceY = sourceBox.y + sourceBox.height / 2;
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;

    await this.page.mouse.move(sourceX, sourceY);
    await this.page.mouse.down();
    await this.page.waitForTimeout(100);
    await this.page.mouse.move(sourceX + 5, sourceY + 5, { steps: 5 }); // ✅ initiate drag
    await this.page.mouse.move(targetX, targetY, { steps: 20 }); // ✅ fire dragover
    await this.page.mouse.up();
  }
  // Method 3: HTML5 drag-drop (DataTransfer API)
  // Some sites use HTML5 drag-drop events instead of mouse
  async html5DragDrop(source: Locator, target: Locator) {
    // This requires injecting JavaScript to trigger drag events
    await source.evaluate((el) => {
      const dataTransfer = new DataTransfer();
      el.dispatchEvent(new DragEvent("dragstart", { dataTransfer }));
    });

    await target.evaluate((el) => {
      const dataTransfer = new DataTransfer();
      el.dispatchEvent(new DragEvent("drop", { dataTransfer }));
    });
  }

  // ── READING VALUES ───────────────────────────────────────

  // Get the text inside column A
  async getColumnAText(): Promise<string> {
    return (await this.columnA.textContent()) || "";
  }

  // Get the text inside column B
  async getColumnBText(): Promise<string> {
    return (await this.columnB.textContent()) || "";
  }

  // ── ASSERTIONS ───────────────────────────────────────────

  // Verify column A contains specific text
  async expectColumnAText(expectedText: string) {
    await expect(this.columnA).toContainText(expectedText);
  }

  // Verify column B contains specific text
  async expectColumnBText(expectedText: string) {
    await expect(this.columnB).toContainText(expectedText);
  }

  // Verify drag-drop swapped the contents
  async expectSwapped() {
    // After dragging A to B, column A should show "B" and vice versa
    await this.expectColumnAText("B");
    await this.expectColumnBText("A");
  }

  // Verify elements are in their original positions
  async expectOriginalState() {
    await this.expectColumnAText("A");
    await this.expectColumnBText("B");
  }
}

// ============================================================
// 📖 DRAG & DROP CONCEPTS
// ============================================================
//
// CONCEPT 1: Two types of drag-drop
// ──────────────────────────────────
// 1. Mouse-based: Simulates physical mouse dragging
//    → dragTo() uses this
//    → Works for most modern drag-drop libraries
//
// 2. HTML5 drag-drop: Uses DataTransfer API
//    → Some older sites use this
//    → Requires JavaScript injection
//
// CONCEPT 2: When dragTo() fails
// ───────────────────────────────
// If dragTo() doesn't work, try:
//  1. Add { force: true } option
//  2. Use manual mouse movements
//  3. Use html5DragDrop() method
//  4. Check if element is actually draggable
//
// ============================================================
// 📖 COMMON PATTERNS
// ============================================================
//
// Pattern 1: Kanban board (drag task between columns)
// ────────────────────────────────────────────────────
// Pattern 2: Reorder list items
// ──────────────────────────────
// Pattern 3: File upload via drag-drop
// Pattern 4: Resize panels (drag divider)
// ────────────────────────────────────────
// Pattern 5: Shopping cart (drag product to cart)
// ────────────────────────────────────────────────
// const product = page.locator('.product:has-text("Laptop")');
// const cart = page.locator('#shopping-cart');
// await product.dragTo(cart);
// await expect(cart).toContainText('Laptop');
//
// ============================================================
// 🚨 TROUBLESHOOTING DRAG & DROP
// ============================================================
//
// Issue 1: dragTo() does nothing
// ───────────────────────────────
// Try: await source.dragTo(target, { force: true });
//
// Issue 2: Element moves but doesn't drop
// ────────────────────────────────────────
// The target might not be accepting drops.
// Check if target has proper event listeners.
//
// Issue 3: Drag works in headed mode, fails in headless
// ──────────────────────────────────────────────────────
// Add small delays:
// await source.hover();
// await page.waitForTimeout(100);
// await source.dragTo(target);
//
// Issue 4: Need to drag to specific coordinates
// ──────────────────────────────────────────────
// Use targetPosition option:
// await source.dragTo(target, {
//   targetPosition: { x: 50, y: 50 }  // Drop at specific offset
// });
//
// ============================================================
