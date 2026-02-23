import { Page, Locator, expect, FileChooser } from "@playwright/test";
import * as path from "path";

// ============================================================
// 📖 LECTURE: File Upload Page Object
// ============================================================
//  - setInputFiles() → the main upload method
//  - Handling drag-and-drop upload zones
//  - Verifying uploaded file names
//  - Testing multiple file uploads
//  - Error handling for invalid file types
//
// PLAYWRIGHT DOCS:
//   https://playwright.dev/docs/input#upload-files
//   https://playwright.dev/docs/api/class-filechooser
// ============================================================

export class FileUploadPage {
  readonly page: Page;

  // File input element (hidden behind custom UI)
  readonly fileInput: Locator;

  // The drag-drop zone (visible area)
  readonly dropZone: Locator;

  // Upload button
  readonly uploadButton: Locator;

  // Status message after upload
  readonly uploadStatus: Locator;

  // List of uploaded files
  readonly uploadedFilesList: Locator;

  readonly URL = "/upload";

  constructor(page: Page) {
    this.page = page;

    // 📖 CONCEPT: File inputs are often hidden with CSS
    // The real <input type="file"> is invisible, but Playwright
    // can still interact with it using setInputFiles()
    this.fileInput = page.getByTestId("file-input");

    // The visible drop zone users see
    this.dropZone = page.getByTestId("file-input");

    // Upload button appears after file is selected
    this.uploadButton = page.getByTestId("file-submit");

    // Success/error message
    this.uploadStatus = page.locator("#uploaded-files");

    // List showing uploaded filenames
    this.uploadedFilesList = page.getByRole("heading", {
      name: "File Uploaded!",
    });
  }

  async goto() {
    await this.page.goto(this.URL);
  }

  // ── UPLOAD METHODS ───────────────────────────────────────

  // Method 1: Upload via setInputFiles (PREFERRED)
  // This works even if the input is hidden
  // 📖 https://playwright.dev/docs/input#upload-files
  async uploadFile(filename: string) {
    // Construct absolute path to test file
    // __dirname → current file's directory
    const filePath = path.join(__dirname, "../fixtures", filename);

    // setInputFiles() accepts:
    //  - string (file path)
    //  - array of strings (multiple files)
    //  - Buffer (file content)
    //  - object with name/mimeType/buffer
    await this.fileInput.setInputFiles(filePath);
  }

  // Method 2: Upload multiple files at once
  async uploadMultipleFiles(filenames: string[]) {
    const filePaths = filenames.map((name) =>
      path.join(__dirname, "../fixtures", name),
    );
    await this.fileInput.setInputFiles(filePaths);
  }

  // Method 3: Upload via FileChooser (for native OS dialogs)
  // 📖 https://playwright.dev/docs/api/class-filechooser
  async uploadViaFileChooser(filename: string) {
    const filePath = path.join(__dirname, "../fixtures", filename);

    // Listen for the file chooser dialog
    const fileChooserPromise = this.page.waitForEvent("filechooser");

    // Click the button that triggers it
    await this.dropZone.click();

    // Wait for dialog and set file
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
  }

  // Clear the selected file (reset to empty)
  async clearUpload() {
    await this.fileInput.setInputFiles([]);
  }

  async clickUpload() {
    await this.uploadButton.click();
  }

  // ── ASSERTIONS ───────────────────────────────────────────

  async expectFileSelected(filename: string) {
    const input = this.page.getByTestId("file-input");

    const actualFileName = await input.evaluate(
      (el: HTMLInputElement) => el.files?.[0]?.name,
    );

    expect(actualFileName).toBe(filename);
  }
  async expectUploadSuccess() {
    await expect(this.uploadStatus).toBeVisible();
    // The site shows a list of uploaded files
    await expect(this.uploadedFilesList.first()).toBeVisible();
  }

  async expectUploadedFileInList(filename: string) {
    await expect(this.page.getByText(filename, { exact: false })).toBeVisible();
  }

  async expectFileInputAccepts(types: string) {
    // Check the accept attribute (e.g., ".jpg,.png")
    await expect(this.fileInput).toHaveAttribute("accept", types);
  }
}

// ============================================================
// 📖 REAL-WORLD PATTERNS
// ============================================================
//
// Pattern 1: Testing file type restrictions
// Pattern 2: Testing file size limits
// Pattern 3: Multiple file upload
// Pattern 4: Upload then download same file
// ============================================================
