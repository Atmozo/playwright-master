# 🎓 Playwright Level 1 — Complete Guide

> **Practice site:** https://practice.expandtesting.com

---

---

## Core Concepts

### Page Object Model (POM)

Instead of repeating selectors across 15 test files, centralize them in a page class. When a selector changes, you fix it in one place.

```typescript
// pages/LoginPage.ts
this.loginButton = page.getByRole("button", { name: "Login" });

// tests/login.spec.ts
await loginPage.login(user, pass);
```

> https://playwright.dev/docs/pom

---

### Locator Strategies

**Tier 1 — Always prefer (resilient)**

```typescript
page.getByRole("button", { name: "Login" });
page.getByLabel("Username");
```

**Tier 2 — Good fallbacks**

```typescript
page.getByText("Welcome back!");
page.getByPlaceholder("Enter your username");
page.getByTestId("login-button");
```

**Tier 3 — Last resort**

```typescript
page.locator("#username"); // breaks if IDs change
page.locator('//input[@name="x"]'); // XPath, avoid
```

> https://playwright.dev/docs/locators

---

### Test Structure

```typescript
test.describe("Login Flow", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("TC-L01 | should login", async () => {
    await loginPage.login("practice", "pass");
    await loginPage.expectOnSecurePage();
  });
});
```

Each test gets a fresh browser context automatically — no shared state between tests.

> https://playwright.dev/docs/test-fixtures

---

### Assertions

```typescript
// Visibility & State
await expect(locator).toBeVisible();
await expect(locator).toBeEnabled();
await expect(locator).toBeChecked();

// Text
await expect(locator).toHaveText("exact text");
await expect(locator).toContainText("partial");
await expect(locator).toHaveValue("input value");

// Attributes
await expect(locator).toHaveAttribute("type", "password");
await expect(locator).toHaveClass("active");

// Page
await expect(page).toHaveURL(/login/);
await expect(page).toHaveTitle(/Login Page/);

// Count
await expect(locator).toHaveCount(5);
```

**Soft assertions** — collect all failures instead of stopping at the first:

```typescript
await expect.soft(locator1).toBeVisible();
await expect.soft(locator2).toBeVisible(); // runs even if above fails
```

> https://playwright.dev/docs/test-assertions

---

### Input Actions

```typescript
await input.fill("text"); // clear + paste — preferred
await input.pressSequentially("t"); // char-by-char (for autocomplete/React inputs)
await input.clear();
await input.press("Enter");
await input.press("Control+A");
const value = await input.inputValue();
```

---

## Part 2: Advanced Interactions

### File Upload

```typescript
// Standard input
await input.setInputFiles("/path/to/file.txt");
await input.setInputFiles(["/path/file1.txt", "/path/file2.pdf"]); // multiple
await input.setInputFiles([]); // clear

// When upload is triggered by a button (file picker dialog)
const [fileChooser] = await Promise.all([
  page.waitForEvent("filechooser"),
  page.click("#upload-button"), // Promise.all prevents race condition
]);
await fileChooser.setFiles("/path/to/file.txt");
```

> https://playwright.dev/docs/input#upload-files

---

### File Download

```typescript
// Always use Promise.all — listener must be registered before the click
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.click('a:has-text("Download")'),
]);

await download.saveAs("/path/to/save/file.txt");
// download.suggestedFilename(), download.path(), download.url()
```

> https://playwright.dev/docs/downloads

---

### Network Interception (Blocking Ads)

Register routes **before** `page.goto()` so they're active from the first request.

```typescript
async function blockAds(page: Page) {
  await page.route("**/*doubleclick.net/**", (route) => route.abort());
  await page.route("**/*googlesyndication.com/**", (route) => route.abort());
}

test.beforeEach(async ({ page }) => {
  await blockAds(page); // before goto!
  await page.goto("/upload");
});
```

Other uses:

```typescript
await page.route("**/*.{png,jpg,gif}", (route) => route.abort()); // block images
await page.route("**/api/users", (route) =>
  route.fulfill({ status: 200, body: "..." }),
); // mock API
```

> https://playwright.dev/docs/network#abort-requests

---

### `beforeAll` vs `beforeEach`

Use `beforeEach` for anything involving browser state. `beforeAll` runs once per worker, and Playwright can distribute tests across different workers — so a `beforeAll` that navigates a page may run in a different worker than the test itself.

```typescript
// ✅ Safe
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

// ⚠️ Risky — page might be in a different worker than your test
test.beforeAll(async ({ page }) => {
  await page.goto("/");
});
```

Use `beforeAll` for: database seeding, API tokens, operations that don't touch browser state.

---

### Dynamic Tables

```typescript
const rowCount = await page.locator("tbody tr").count();
const firstRow = page.locator("tbody tr").nth(0);
const rows = await page.locator("tbody tr").all();
const headers = await page.locator("thead th").allTextContents(); // → ['Name', 'Age']

// Get a specific cell
const cell = page.locator("tr").nth(2).locator("td").nth(1);

// Find row by content
const targetRow = page.locator('tr:has-text("Alice")');

// Click action button in a row
await page.locator("tr").nth(0).getByRole("button", { name: "Edit" }).click();
```

> https://playwright.dev/docs/locators#lists

---

### IFrames

```typescript
// ✅ Modern way
const iframe = page.frameLocator('iframe[name="frameName"]');
await iframe.locator("#button").click();

// Nested iframes
const outer = page.frameLocator("#outer-frame");
const inner = outer.frameLocator("#inner-frame");
await inner.locator("input").fill("text");
```

No "switching" needed — just use the right frameLocator.

> https://playwright.dev/docs/frames

---

### Multiple Windows

```typescript
// ✅ Correct — register listener before the click
const newPagePromise = context.waitForEvent("page");
await page.click('a[target="_blank"]');
const newPage = await newPagePromise;
await newPage.waitForLoadState();

// Find window by title or URL
for (const p of context.pages()) {
  if ((await p.title()).includes("Settings")) return p;
  if (p.url().includes("/dashboard")) return p;
}

await page.bringToFront(); // focus a window
await secondPage.close();
```

> https://playwright.dev/docs/pages

---

### Drag & Drop

```typescript
// Usually this is all you need
await source.dragTo(target);

// If that fails
await source.dragTo(target, { force: true });

// Manual fallback
const sourceBox = await source.boundingBox();
const targetBox = await target.boundingBox();
await page.mouse.move(
  sourceBox.x + sourceBox.width / 2,
  sourceBox.y + sourceBox.height / 2,
);
await page.mouse.down();
await page.mouse.move(
  targetBox.x + targetBox.width / 2,
  targetBox.y + targetBox.height / 2,
);
await page.mouse.up();
```

> https://playwright.dev/docs/input#dragging

---

## Running Tests

```bash
npx playwright test                              # all tests
npx playwright test tests/level1/login.spec.ts  # specific file
npx playwright test -g "TC-L02"                 # by name/pattern
npx playwright test --headed                    # see the browser
npx playwright test --ui                        # visual mode (best for debugging)
npx playwright test --debug                     # step through line by line
npx playwright show-report                      # HTML report
npx playwright codegen https://...              # record actions → generate code
npx playwright test --workers=1                 # run sequentially
npx playwright test --retries=2                 # retry on failure
npx playwright test --last-failed               # re-run only failed tests
```

---

## Debugging Workflow

```
1. Read the terminal error
2. npx playwright show-report   → screenshot + trace
3. npx playwright test --ui     → replay visually
4. npx playwright test --debug  → step through
5. npx playwright codegen       → see suggested selectors
```

```bash
npx playwright show-trace test-results/.../trace.zip
```

---

## Test Cases

### Login

| ID        | Test                   | Type     |
| --------- | ---------------------- | -------- |
| TC-L01    | Page loads correctly   | Smoke    |
| TC-L02    | Successful login       | Positive |
| TC-L03    | Logout after login     | Positive |
| TC-L04    | Invalid username error | Negative |
| TC-L05    | Invalid password error | Negative |
| TC-L06–08 | Empty fields blocked   | Boundary |
| TC-L09    | SQL injection handled  | Security |

### Register

| ID         | Test                            | Type        |
| ---------- | ------------------------------- | ----------- |
| TC-R01     | Page loads correctly            | Smoke       |
| TC-R02     | Successful registration         | Positive    |
| TC-R03     | Password mismatch error         | Negative    |
| TC-R04–06  | Empty fields blocked            | Boundary    |
| TC-FV01–05 | Input behavior, states, polling | Educational |
| TC-AUTH01  | Register → Login → Logout       | E2E         |

---

## Essential Docs

| Topic          | URL                                         |
| -------------- | ------------------------------------------- |
| POM            | https://playwright.dev/docs/pom             |
| Locators       | https://playwright.dev/docs/locators        |
| Assertions     | https://playwright.dev/docs/test-assertions |
| Input          | https://playwright.dev/docs/input           |
| Downloads      | https://playwright.dev/docs/downloads       |
| Frames         | https://playwright.dev/docs/frames          |
| Pages/Windows  | https://playwright.dev/docs/pages           |
| Network        | https://playwright.dev/docs/network         |
| Trace Viewer   | https://playwright.dev/docs/trace-viewer    |
| Best Practices | https://playwright.dev/docs/best-practices  |
