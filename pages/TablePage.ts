import { Page, Locator, expect } from "@playwright/test";

// ============================================================
// 📖 LECTURE: Dynamic Table Page Object
// ============================================================
// KEYS INIT:
//  - Looping through table rows
//  - .locator().nth() → get specific row
//  - .locator().all() → get all matching elements
//  - Extracting text from cells
//  - Sorting validation
//  - Filtering/searching tables
//  - Finding rows by cell content
//
// PLAYWRIGHT DOCS:
//   https://playwright.dev/docs/locators#lists
//   https://playwright.dev/docs/api/class-locator#locator-nth
//   https://playwright.dev/docs/api/class-locator#locator-all
// ============================================================

export class TablePage {
  readonly page: Page;

  // Table locators
  readonly table: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;
  readonly tableCells: Locator;

  readonly URL = "/tables";

  constructor(page: Page) {
    this.page = page;

    // Main table (there might be multiple tables on the page)
    this.table = page.locator("table#table1");

    // All header cells (th)
    this.tableHeaders = this.table.locator("thead th");

    // All body rows (tr in tbody)
    this.tableRows = this.table.locator("tbody tr");

    // All cells (td)
    this.tableCells = this.table.locator("tbody td");
  }

  async goto() {
    await this.page.goto(this.URL);
  }

  // ── TABLE NAVIGATION METHODS ─────────────────────────────

  // Get number of rows in the table
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  // Get number of columns
  async getColumnCount(): Promise<number> {
    const firstRow = this.tableRows.nth(0);
    return await firstRow.locator("td").count();
  }

  // Get all headers as array of strings
  async getHeaders(): Promise<string[]> {
    const headers = await this.tableHeaders.allTextContents();
    return headers;
  }

  // Get a specific row (0-indexed)
  // 📖 .nth(index) → returns the nth matching element
  // https://playwright.dev/docs/api/class-locator#locator-nth
  getRow(index: number): Locator {
    return this.tableRows.nth(index);
  }

  // Get a specific cell (row index, column index)
  async getCellText(rowIndex: number, colIndex: number): Promise<string> {
    const row = this.getRow(rowIndex);
    const cell = row.locator("td").nth(colIndex);
    return (await cell.textContent()) || "";
  }

  // Get entire row as array of cell texts
  async getRowData(rowIndex: number): Promise<string[]> {
    const row = this.getRow(rowIndex);
    const cells = await row.locator("td").allTextContents();
    return cells.map((c) => c.trim());
  }

  // Get all table data as 2D array
  // 📖 .all() → returns array of all matching locators
  // https://playwright.dev/docs/api/class-locator#locator-all
  async getAllTableData(): Promise<string[][]> {
    const rows = await this.tableRows.all();
    const data: string[][] = [];

    for (const row of rows) {
      const cells = await row.locator("td").allTextContents();
      data.push(cells.map((c) => c.trim()));
    }

    return data;
  }

  // ── SEARCH / FILTER METHODS ──────────────────────────────

  // Find row index by cell content
  async findRowIndexByCellContent(
    columnIndex: number,
    searchText: string,
  ): Promise<number> {
    const rowCount = await this.getRowCount();

    for (let i = 0; i < rowCount; i++) {
      const cellText = await this.getCellText(i, columnIndex);
      if (cellText.includes(searchText)) {
        return i;
      }
    }

    return -1; // Not found
  }

  // Find row by content in any column
  async findRowByContent(searchText: string): Promise<number> {
    const rows = await this.tableRows.all();

    for (let i = 0; i < rows.length; i++) {
      const rowText = await rows[i].textContent();
      if (rowText?.includes(searchText)) {
        return i;
      }
    }

    return -1;
  }

  // Click a cell in a specific row/column
  async clickCell(rowIndex: number, colIndex: number) {
    const row = this.getRow(rowIndex);
    const cell = row.locator("td").nth(colIndex);
    await cell.click();
  }

  // Click a button/link inside a specific row
  async clickActionInRow(rowIndex: number, actionName: string) {
    const row = this.getRow(rowIndex);
    // Find button/link with specific text (e.g., "Edit", "Delete")
    await row.getByRole("link", { name: actionName }).click();
  }

  // ── SORTING METHODS ──────────────────────────────────────

  // Click a column header to sort
  async clickColumnHeader(columnName: string) {
    await this.table.locator("thead th", { hasText: columnName }).click();
  }

  // Verify if a column is sorted ascending
  async isColumnSortedAscending(columnIndex: number): Promise<boolean> {
    const data = await this.getAllTableData();
    const columnValues = data.map((row) => row[columnIndex]);

    // Check if sorted
    const sorted = [...columnValues].sort();
    return JSON.stringify(columnValues) === JSON.stringify(sorted);
  }

  // Verify if a column is sorted descending
  async isColumnSortedDescending(columnIndex: number): Promise<boolean> {
    const data = await this.getAllTableData();
    const columnValues = data.map((row) => row[columnIndex]);

    // Check if reverse sorted
    const sorted = [...columnValues].sort().reverse();
    return JSON.stringify(columnValues) === JSON.stringify(sorted);
  }

  // Get column data as array
  async getColumnData(columnIndex: number): Promise<string[]> {
    const data = await this.getAllTableData();
    return data.map((row) => row[columnIndex]);
  }

  // ── ASSERTIONS ───────────────────────────────────────────

  async expectRowCount(expectedCount: number) {
    await expect(this.tableRows).toHaveCount(expectedCount);
  }

  async expectCellContent(
    rowIndex: number,
    colIndex: number,
    expectedText: string,
  ) {
    const cell = this.getRow(rowIndex).locator("td").nth(colIndex);
    await expect(cell).toContainText(expectedText);
  }

  async expectRowContains(rowIndex: number, expectedText: string) {
    const row = this.getRow(rowIndex);
    await expect(row).toContainText(expectedText);
  }

  async expectHeaderExists(headerName: string) {
    await expect(
      this.table.locator("thead th", { hasText: headerName }),
    ).toBeVisible();
  }
}

// ============================================================
// 📖 COMMON TABLE TESTING PATTERNS
// ============================================================
//
// Pattern 1: Verify row count after filter
// ─────────────────────────────────────────
// Pattern 2: Find and edit a specific row
// ────────────────────────────────────────
// Pattern 3: Verify sorting
// ─────────────────────────
// Pattern 4: Extract and assert on specific cell
// ───────────────────────────────────────────────
// Pattern 5: Iterate through all rows
// ────────────────────────────────────
// Pattern 6: Verify pagination
// ─────────────────────────────
// ============================================================
