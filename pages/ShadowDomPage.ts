import { Page, Locator, expect } from "@playwright/test";

// ============================================================
//  LECTURE: Shadow DOM Page Object
// ============================================================
// WHAT IS SHADOW DOM?
//   Shadow DOM is a web standard that allows developers to
//   encapsulate HTML, CSS, and JavaScript within a custom
//   element. It creates a "shadow tree" that is:
//   - Hidden from the main document
//   - Has its own scoped styles (CSS isolation)
//   - Protected from external JavaScript
//
// WHY SHADOW DOM?
//   1. CSS Encapsulation: Styles don't leak in or out
//   2. DOM Encapsulation: Internal structure is hidden
//   3. Reusable Components: Build once, use anywhere
//
// REAL-WORLD EXAMPLES:
//   - Salesforce Lightning Components (massive use)
//   - Google's Polymer components
//   - Web Components (custom elements)
//   - Modern UI libraries (Shoelace, Lion, etc.)
//   - Browser native elements (video player, date picker)
//
// THE PROBLEM FOR TESTING:
//   Regular locators CANNOT see inside Shadow DOM!
//
//    This won't work:
//   page.locator('#button-inside-shadow').click();
//   → NoSuchElementException
//
// PLAYWRIGHT DOCS:
//   https://playwright.dev/docs/other-locators#css-matching-shadow-dom
// ============================================================

export class ShadowDOMPage {
  readonly page: Page;

  readonly URL = "/shadowdom";

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(this.URL);
  }

  // ══════════════════════════════════════════════════════════
  //  METHOD 1: Piercing Selector (EASIEST - Playwright Magic)
  // ══════════════════════════════════════════════════════════
  //
  // Playwright's >>> combinator pierces through shadow boundaries
  // automatically. This is the PREFERRED method.
  //
  // Syntax: 'host >>> #shadow-element'
  //
  // https://playwright.dev/docs/other-locators#css-matching-shadow-dom

  async clickButtonViaPiercingSelector() {
    //  The >>> combinator pierces shadow boundaries
    // '#shadow-host' → the host element (in main DOM)
    // '>>>' → pierce into shadow root
    // '#my-btn' → element inside shadow DOM
    await this.page.locator("#shadow-host >>> #my-btn").click();
  }

  async getButtonTextViaPiercing(): Promise<string> {
    return (
      (await this.page.locator("#shadow-host >>> #my-btn").textContent()) || ""
    );
  }

  // ══════════════════════════════════════════════════════════
  //  METHOD 2: JavaScript Evaluation (MANUAL APPROACH)
  // ══════════════════════════════════════════════════════════
  //
  // When piercing doesn't work (rare), you can manually access
  // shadowRoot via JavaScript.
  //
  // This is HOW browsers actually work with Shadow DOM.

  async clickButtonViaJavaScript() {
    // Access shadowRoot explicitly
    await this.page.evaluate(() => {
      const host = document.querySelector("#shadow-host");
      if (host && host.shadowRoot) {
        const button = host.shadowRoot.querySelector("#my-btn") as HTMLElement;
        if (button) button.click();
      }
    });
  }

  async getButtonTextViaJavaScript(): Promise<string> {
    return await this.page.evaluate(() => {
      const host = document.querySelector("#shadow-host");
      if (host && host.shadowRoot) {
        const button = host.shadowRoot.querySelector("#my-btn");
        return button?.textContent || "";
      }
      return "";
    });
  }

  // ══════════════════════════════════════════════════════════
  //  METHOD 3: Nested Shadow DOM (Multiple Levels)
  // ══════════════════════════════════════════════════════════
  //
  // Some components have shadow DOM INSIDE shadow DOM.
  // You need to chain the piercings.
  //
  // Structure:
  // main-component (shadow root)
  //   ├─ nested-component (shadow root)
  //   │   └─ button

  async clickNestedShadowButton() {
    // Chain multiple >>> combinators
    await this.page
      .locator("#outer-shadow >>> #inner-shadow >>> button")
      .click();
  }

  // ══════════════════════════════════════════════════════════
  //  METHOD 4: Working with Open vs Closed Shadow Roots
  // ══════════════════════════════════════════════════════════
  //
  // Shadow DOM has two modes:
  // - mode: 'open'  → shadowRoot is accessible via JS
  // - mode: 'closed' → shadowRoot is null (more secure)
  //
  // Most production apps use 'open' because 'closed' is
  // very difficult to maintain and test.

  async checkShadowRootMode(): Promise<string> {
    return await this.page.evaluate(() => {
      const host = document.querySelector("#shadow-host") as any;
      if (host) {
        // Try to access shadowRoot
        if (host.shadowRoot) {
          return "open";
        } else {
          // Closed shadow roots return null
          return "closed (or no shadow root)";
        }
      }
      return "host not found";
    });
  }

  // ══════════════════════════════════════════════════════════
  //  COMMON PATTERNS & HELPERS
  // ══════════════════════════════════════════════════════════

  // Find ALL elements inside shadow DOM
  async getAllButtonsInShadowDOM(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const host = document.querySelector("#shadow-host");
      if (host && host.shadowRoot) {
        const buttons = host.shadowRoot.querySelectorAll("button");
        return Array.from(buttons).map((btn) => btn.textContent || "");
      }
      return [];
    });
  }

  // Wait for element inside shadow DOM
  async waitForShadowElement(selector: string) {
    await this.page.waitForFunction((sel) => {
      const host = document.querySelector("#shadow-host");
      if (host && host.shadowRoot) {
        return host.shadowRoot.querySelector(sel) !== null;
      }
      return false;
    }, selector);
  }

  // Check if element is inside shadow DOM
  async isElementInShadowDOM(selector: string): Promise<boolean> {
    return await this.page.evaluate((sel) => {
      const host = document.querySelector("#shadow-host");
      if (host && host.shadowRoot) {
        return host.shadowRoot.querySelector(sel) !== null;
      }
      return false;
    }, selector);
  }

  // Get computed styles from shadow element
  async getShadowElementStyle(
    selector: string,
    property: string,
  ): Promise<string> {
    return await this.page.evaluate(
      ({ sel, prop }) => {
        const host = document.querySelector("#shadow-host");
        if (host && host.shadowRoot) {
          const element = host.shadowRoot.querySelector(sel) as HTMLElement;
          if (element) {
            return window.getComputedStyle(element).getPropertyValue(prop);
          }
        }
        return "";
      },
      { sel: selector, prop: property },
    );
  }

  // ══════════════════════════════════════════════════════════
  //  ASSERTIONS
  // ══════════════════════════════════════════════════════════

  async expectButtonVisible() {
    await expect(this.page.locator("#shadow-host >>> #my-btn")).toBeVisible();
  }

  async expectButtonText(expectedText: string) {
    await expect(this.page.locator("#shadow-host >>> #my-btn")).toContainText(
      expectedText,
    );
  }

  async expectShadowHostExists() {
    await expect(this.page.locator("#shadow-host")).toBeVisible();
  }
}

// ============================================================
//  DEBUGGING SHADOW DOM
// ============================================================
//
// Chrome DevTools:
// 1. Right-click element → Inspect
// 2. Look for #shadow-root (user-agent) in Elements tab
// 3. Expand to see shadow tree
//
// Console commands:
// $0.shadowRoot                    // Access shadow root of selected element
// $0.shadowRoot.querySelector('#id') // Find element inside shadow
//
// Playwright Inspector:
// - Use piercing selector: '#host >>> #element'
// - Or use evaluate() to log shadowRoot structure
//
// ============================================================
//  REAL-WORLD SHADOW DOM EXAMPLES
// ============================================================
//
// Salesforce Lightning:
// await page.locator('lightning-input >>> input').fill('text');
//
// Shoelace UI Library:
// await page.locator('sl-button >>> button').click();
//
// YouTube Player:
// await page.locator('ytd-player >>> #play-button').click();
//
// Material Web Components:
// await page.locator('mwc-textfield >>> input').fill('value');
//
// Native Browser Elements (video, date picker):
// Some browsers use shadow DOM for native controls
//
// ============================================================
//  COMMON PITFALLS
// ============================================================
//
//  MISTAKE 1: Using XPath on shadow elements
// XPath DOES NOT WORK with Shadow DOM.
// page.locator('//button[@id="my-btn"]')  //  Won't find it!
//
//  SOLUTION: Use CSS or piercing selectors
// page.locator('#shadow-host >>> #my-btn')
//
//  MISTAKE 2: Trying to screenshot shadow content
// page.locator('#shadow-host >>> #my-btn').screenshot()  // Might fail
//
//  SOLUTION: Screenshot the host element
// page.locator('#shadow-host').screenshot()
//
//  MISTAKE 3: Assuming all custom elements use shadow DOM
// Not all <custom-element> tags have shadow roots!
// Always verify in DevTools first.
//
// ============================================================
