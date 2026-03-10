import { Page, expect, Download } from "@playwright/test";
import * as fs from "fs";

// ============================================================
//  LECTURE: File Download Page Object
// ============================================================
//  LEARN:
//  - waitForEvent('download') → intercept downloads
//  - download.path() → get downloaded file path
//  - download.suggestedFilename() → get the filename
//  - Reading downloaded file content
//  - Verifying file size, type, content
//
// PLAYWRIGHT DOCS:
//   https://playwright.dev/docs/downloads
//   https://playwright.dev/docs/api/class-download
// ============================================================

export class FileDownloadPage {
  readonly page: Page;

  readonly URL = "/download";

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(this.URL);
  }

  // ── DOWNLOAD METHODS ─────────────────────────────────────

  // Download a file by clicking its link
  // Returns the Download object for further assertions
  async downloadFileByName(filename: string): Promise<Download> {
    //  CRITICAL PATTERN:
    // Start waiting for download BEFORE clicking the link.
    // If you click first, you might miss the event.
    const downloadPromise = this.page.waitForEvent("download");

    // Click the download link
    // getByRole('link') → finds <a> tags
    await this.page.getByRole("link", { name: filename }).click();

    // Wait for the download to start
    const download = await downloadPromise;

    return download;
  }

  // Download and save to a specific path
  async downloadAndSave(filename: string, savePath: string): Promise<void> {
    const download = await this.downloadFileByName(filename);

    // saveAs() → saves the download to a custom location
    //  https://playwright.dev/docs/api/class-download#download-save-as
    await download.saveAs(savePath);
  }

  // Download and read file content as string
  async downloadAndReadText(filename: string): Promise<string> {
    const download = await this.downloadFileByName(filename);

    // path() → returns temp path where Playwright stored the download
    // This file is auto-deleted when the browser closes
    const filePath = await download.path();

    if (!filePath) {
      throw new Error("Download failed - no path returned");
    }

    // Read the file content
    const content = fs.readFileSync(filePath, "utf-8");
    return content;
  }

  // Download and read file content as Buffer (for binary files)
  async downloadAndReadBuffer(filename: string): Promise<Buffer> {
    const download = await this.downloadFileByName(filename);
    const filePath = await download.path();

    if (!filePath) {
      throw new Error("Download failed - no path returned");
    }

    return fs.readFileSync(filePath);
  }

  // Get list of all downloadable files on the page
  async getDownloadableFiles(): Promise<string[]> {
    const links = this.page.locator('a[href^="download/"]');
    const count = await links.count();

    const filenames: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).innerText();
      filenames.push(text.trim());
    }

    return filenames;
  } // ── ASSERTION HELPERS ────────────────────────────────────

  async expectDownloadStarted(download: Download) {
    // suggestedFilename() → the name the browser wants to save as
    const filename = download.suggestedFilename();
    expect(filename).toBeTruthy();
  }

  async expectDownloadedFileExists(download: Download) {
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    expect(fs.existsSync(filePath!)).toBe(true);
  }

  async expectDownloadedFileSize(download: Download, minSize: number) {
    const filePath = await download.path();
    const stats = fs.statSync(filePath!);
    expect(stats.size).toBeGreaterThan(minSize);
  }

  async expectDownloadedTextContent(
    download: Download,
    expectedContent: string,
  ) {
    const filePath = await download.path();
    const content = fs.readFileSync(filePath!, "utf-8");
    expect(content).toContain(expectedContent);
  }

  async expectFileInDownloadList(filename: string) {
    await expect(this.page.getByRole("link", { name: filename })).toBeVisible();
  }
}

// ============================================================
//  ADVANCED PATTERNS
// ============================================================
//
// Pattern 1: Verify download metadata
// ────────────────────────────────────
// Pattern 2: Download and verify JSON content
// ────────────────────────────────────────────
// Pattern 3: Download and verify image
// ─────────────────────────────────────
// Pattern 4: Cancel a download
// ─────────────────────────────
// ============================================================
