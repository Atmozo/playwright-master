// ============================================================
// 🎓 LEVEL 1 — Challenge 3: File Upload & Download
// Sites: /upload and /download
// ============================================================
//
// LEARN:
//  ✅ setInputFiles() → upload files programmatically
//  ✅ waitForEvent('download') → intercept downloads
//  ✅ download.path() → get downloaded file location
//  ✅ download.saveAs() → save to custom location
//  ✅ Reading file content after download
//  ✅ Testing multiple file upload
//  ✅ Verifying file metadata
//  ✅ page.route() → block unwanted network requests
//
// 📖 PLAYWRIGHT DOCS TO READ:
//  File upload:    https://playwright.dev/docs/input#upload-files
//  File download:  https://playwright.dev/docs/downloads
//  FileChooser:    https://playwright.dev/docs/api/class-filechooser
//  Download:       https://playwright.dev/docs/api/class-download
//  Network:        https://playwright.dev/docs/network#abort-requests
// ============================================================

import { test, expect, Page } from "@playwright/test";
import { FileUploadPage } from "../../pages/fileuploadPage";
import { FileDownloadPage } from "../../pages/filedownloadPage";
import * as path from "path";
import * as fs from "fs";

// ============================================================
// 🛠️ HELPER: Block ads at the network level
// ============================================================
//
// 📖 WHY network blocking beats UI dismissal:
//
//   UI approach problems:
//   - Ads are timer-based: they reappear every ~30-60s
//   - The ad loads BEFORE your dismiss code can click it
//   - Different ad creatives use different selectors each time
//
//   Network approach advantages:
//   - Ad requests aborted BEFORE any content loads
//   - No popup ever appears — nothing blocks your clicks
//   - Works for every creative without selector maintenance
//
// 📖 HOW page.route() works:
//   page.route(pattern, handler) intercepts matching requests.
//   route.abort() drops the request — ad never loads, no popup.
//
// ⚠️  IMPORTANT: Call blockAds() BEFORE page.goto()
//   Routes must be registered before navigation so they are
//   active for the very first requests the page makes.
//
// https://playwright.dev/docs/network#abort-requests
//
async function blockAds(page: Page) {
  await page.route("**/*doubleclick.net/**", (route) => route.abort());
  await page.route("**/*googlesyndication.com/**", (route) => route.abort());
  await page.route("**/*googleadservices.com/**", (route) => route.abort());
  await page.route("**/*google-analytics.com/**", (route) => route.abort());
  await page.route("**/*googletagservices.com/**", (route) => route.abort());
  await page.route("**/*adservice.google.*/**", (route) => route.abort());
  await page.route("**/*zoho.com/ads/**", (route) => route.abort());
}

// ============================================================
// 🛠️ HELPER: Dismiss any ads that slipped through (safety net)
// ============================================================
//
// Network blocking handles ads loaded from external domains.
// This catches any same-origin ads that can't be blocked
// without also breaking the page itself.
//
async function dismissAnyAds(page: Page) {
  // Nested iframe: aswift_N → ad_iframe → "Close ad"
  try {
    await page
      .frameLocator('iframe[name^="aswift"]')
      .frameLocator('iframe[name="ad_iframe"]')
      .getByRole("button", { name: /close ad/i })
      .click({ timeout: 1500 });
  } catch {}

  // Zoho popup / modal with labelled "Close" button
  try {
    await page
      .getByRole("button", { name: "Close" })
      .first()
      .click({ timeout: 1500 });
  } catch {}

  // Unlabelled × button
  try {
    await page.getByText("×").first().click({ timeout: 1500 });
  } catch {}
}

// ============================================================
test.describe("File Upload", () => {
  let uploadPage: FileUploadPage;

  test.beforeEach(async ({ page }) => {
    await blockAds(page); // ← before goto()
    uploadPage = new FileUploadPage(page);
    await uploadPage.goto();
  });

  test("TC-U01 | should display upload page correctly", async () => {
    await expect(uploadPage.fileInput).toBeAttached();
    await expect(uploadPage.dropZone).toBeVisible();
  });

  test("TC-U02 | should upload a text file successfully", async () => {
    // 📖 CONCEPT: setInputFiles() is THE way to upload in Playwright.
    // It works even if the input is hidden behind a custom UI.
    // https://playwright.dev/docs/input#upload-files
    await uploadPage.uploadFile("test-upload.txt");
    await uploadPage.clickUpload();
    await uploadPage.expectUploadSuccess();
  });

  test("TC-U03 | should upload JSON file successfully", async () => {
    await uploadPage.uploadFile("test-data.json");
    await uploadPage.clickUpload();
    await uploadPage.expectUploadSuccess();
  });

  test("TC-U05 | should handle file upload via FileChooser", async ({
    page,
  }) => {
    // 📖 CONCEPT: Some sites open the OS file picker dialog.
    // Playwright intercepts this with waitForEvent('filechooser')
    // https://playwright.dev/docs/api/class-filechooser
    //
    // 📖 WHY Promise.all?
    // Register the listener BEFORE the click fires the dialog.
    // Promise.all starts both concurrently, eliminating the race.
    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      uploadPage.dropZone.click(),
    ]);

    const filePath = path.join(__dirname, "../../fixtures/test-upload.txt");
    await fileChooser.setFiles(filePath);
    await uploadPage.expectFileSelected("test-upload.txt");
  });
});

// ============================================================
// 📖 Why NOT shared page for download tests?
// ============================================================
//
// I tried test.describe.serial with a shared page in beforeAll.
// The symptom was "Before Hooks: 6ms" — beforeAll ran almost
// instantly, meaning it ran in a DIFFERENT worker to the tests
// themselves. Each test got a fresh unnavigated page instead of
// the shared one, so getDownloadableFiles() returned [].
//
// The reliable solution is simpler:
//   - Use beforeEach (not beforeAll) so setup always runs in
//     the SAME worker/context as the test itself
//   - Block ads at network level so each fresh page is ad-free
//   - Each test is now fully self-contained and reliable
//
// Yes, this means each download test navigates to the page.
// That's a small cost — network blocking makes navigation fast
// because all the heavy ad scripts never load.
//
test.describe("File Download", () => {
  let downloadPage: FileDownloadPage;

  test.beforeEach(async ({ page }) => {
    await blockAds(page); // ← must be before goto()
    downloadPage = new FileDownloadPage(page);
    await downloadPage.goto();
    await dismissAnyAds(page); // safety net for same-origin ads
  });

  test("TC-D01 | should display download page with available files", async () => {
    await downloadPage.expectFileInDownloadList("some-file.txt");
    await downloadPage.expectFileInDownloadList("some-file.json");
  });

  test("TC-D02 | should download text file successfully", async ({ page }) => {
    // 📖 CRITICAL PATTERN: Promise.all for downloads
    //
    // Always register the download listener BEFORE clicking.
    // Promise.all guarantees the listener is in place when
    // the download event fires.
    //
    // ⚠️ Race condition (never do this):
    //   const p = page.waitForEvent("download");
    //   await page.click(link);   // download fires, p might miss it
    //
    // ✅ Safe (always do this):
    //   const [dl] = await Promise.all([
    //     page.waitForEvent("download"),  // registered first
    //     page.click(link),               // triggers download
    //   ]);
    //
    // https://playwright.dev/docs/downloads
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "some-file.txt" }).click(),
    ]);

    await downloadPage.expectDownloadStarted(download);
    await downloadPage.expectDownloadedFileExists(download);
  });

  test("TC-D03 | should download and verify text file content", async () => {
    // 📖 CONCEPT: After downloading, read and assert file content.
    const content = await downloadPage.downloadAndReadText("some-file.txt");
    expect(content.length).toBeGreaterThan(0);
  });

  test("TC-D04 | should download and verify JSON file", async () => {
    const content = await downloadPage.downloadAndReadText("some-file.json");
    const json = JSON.parse(content);
    expect(json).toBeDefined();
  });

  test("TC-D05 | should download image file", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "wdio.png" }).click(),
    ]);

    await downloadPage.expectDownloadedFileExists(download);
    await downloadPage.expectDownloadedFileSize(download, 1000); // At least 1KB
  });

  test("TC-D06 | should save download to custom location", async ({ page }) => {
    // 📖 saveAs() → save to a specific path
    // https://playwright.dev/docs/api/class-download#download-save-as
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "some-file.txt" }).click(),
    ]);

    const customPath = path.join(
      __dirname,
      "../../downloads/my-custom-file.txt",
    );
    await download.saveAs(customPath);
    expect(fs.existsSync(customPath)).toBe(true);
    fs.unlinkSync(customPath); // Clean up
  });

  test("TC-D07 | should get download URL and filename", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "some-file.txt" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("some-file.txt");
    expect(download.url()).toContain("/download/");
  });

  test("TC-D08 | should list all available downloads", async () => {
    const files = await downloadPage.getDownloadableFiles();
    expect(files).toContain("some-file.txt");
    expect(files).toContain("some-file.json");
    expect(files).toContain("wdio.png");
  });
});

// ============================================================
// 🎓 FULL UPLOAD-DOWNLOAD CYCLE TEST
// ============================================================
// this test site dosnt allow the cycle  upload->download .. ill just upload and download exsisting files
test.describe("Upload-Download Cycle", () => {
  test("TC-CYCLE01 | upload a file then download it", async ({ page }) => {
    await blockAds(page); // ← before any navigation

    const downloadPage = new FileDownloadPage(page);
    await downloadPage.goto();
    await dismissAnyAds(page);

    const files = await downloadPage.getDownloadableFiles();
    const uploadedFile = files.find((f) => f.includes("some-file.txt"));
    expect(uploadedFile).toBeDefined();

    // ── STEP 4: Download it ────────────────────────────────
    if (uploadedFile) {
      const content = await downloadPage.downloadAndReadText(uploadedFile);
      expect(content).toContain("Message: Welcome to the Practice Web App");
    }
  });
});

// ============================================================
// 📖 B LEARNED
// ============================================================
//
// ✅ File Upload:
//    - setInputFiles(path) → upload a file
//    - setInputFiles([paths]) → upload multiple files
//    - setInputFiles([]) → clear upload
//    - waitForEvent('filechooser') → handle OS dialogs
//
// ✅ File Download:
//    - waitForEvent('download') → intercept downloads
//    - download.path() → get temp file path
//    - download.saveAs(path) → save to custom location
//    - download.suggestedFilename() → get filename
//    - download.url() → get download URL
//
// ✅ Network Interception (page.route):
//    - page.route(pattern, handler) → intercept requests
//    - route.abort() → drop the request entirely
//    - ALWAYS register routes before page.goto()
//    - Glob patterns: "**/*doubleclick.net/**"
//    - More reliable than UI-based ad dismissal
//
// ✅ beforeAll vs beforeEach:
//    - beforeAll runs once per describe block per WORKER
//    - If Playwright distributes tests across workers, beforeAll
//      in one worker won't apply to tests in another worker
//    - beforeEach always runs in the same context as its test
//    - Prefer beforeEach for reliable setup; use beforeAll only
//      for expensive one-time operations (DB seed, auth tokens)
//
// ✅ Best Practices:
//    - Use Promise.all for BOTH downloads AND filechooser events
//    - Always use absolute paths for file uploads
//    - Clean up downloaded files after tests
//    - Verify file content, not just existence
//
// ============================================================
