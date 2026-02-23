// ============================================================
// 🎓 LEVEL 1 — Challenge 4: Dynamic Tables
// Site: /tables
// ============================================================
//
// KEYS IN THIS FILE:
//  ✅ .locator().nth(index) → get specific row/cell
//  ✅ .locator().all() → get array of all elements
//  ✅ .allTextContents() → extract all text at once
//  ✅ Looping through rows
//  ✅ Finding rows by content
//  ✅ Testing sorting
//  ✅ Extracting column data
//  ✅ Working with table headers
//
// 📖 PLAYWRIGHT DOCS TO READ:
//  Lists:        https://playwright.dev/docs/locators#lists
//  .nth():       https://playwright.dev/docs/api/class-locator#locator-nth
//  .all():       https://playwright.dev/docs/api/class-locator#locator-all
//  .allTextContents(): https://playwright.dev/docs/api/class-locator#locator-all-text-contents
// ============================================================

import { test, expect } from "@playwright/test";
import { TablePage } from "../../pages/TablePage";

test.describe("Dynamic Tables", () => {
  let tablePage: TablePage;

  test.beforeEach(async ({ page }) => {
    tablePage = new TablePage(page);
    await tablePage.goto();
  });

  // ══════════════════════════════════════════════════════════
  // ✅ BASIC TABLE STRUCTURE TESTS
  // ══════════════════════════════════════════════════════════

  test("TC-T01 | should display table correctly", async () => {
    // Verify table exists
    await expect(tablePage.table).toBeVisible();

    // Verify has rows
    const rowCount = await tablePage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("TC-T02 | should get correct number of rows", async () => {
    // 📖 CONCEPT: .count() returns number of matching elements
    // https://playwright.dev/docs/api/class-locator#locator-count
    const rowCount = await tablePage.getRowCount();

    // Table should have at least 4 rows (based on the site)
    expect(rowCount).toBeGreaterThanOrEqual(4);
  });

  test("TC-T03 | should get correct number of columns", async () => {
    const columnCount = await tablePage.getColumnCount();

    // Verify table has expected columns
    expect(columnCount).toBeGreaterThan(0);
  });

  test("TC-T04 | should get table headers", async () => {
    // 📖 CONCEPT: allTextContents() returns array of all text
    // https://playwright.dev/docs/api/class-locator#locator-all-text-contents
    const headers = await tablePage.getHeaders();

    // Verify headers exist
    expect(headers.length).toBeGreaterThan(0);

    // Common table headers
    expect(
      headers.some(
        (h) =>
          h.toLowerCase().includes("last name") ||
          h.toLowerCase().includes("first name"),
      ),
    ).toBe(true);
  });

  // ══════════════════════════════════════════════════════════
  // ✅ READING CELL DATA
  // ══════════════════════════════════════════════════════════

  test("TC-T05 | should read specific cell content", async () => {
    // 📖 CONCEPT: .nth(index) gets the element at that position
    // https://playwright.dev/docs/api/class-locator#locator-nth

    // Get text from row 0, column 0
    const cellText = await tablePage.getCellText(0, 0);

    // Cell should not be empty
    expect(cellText.trim().length).toBeGreaterThan(0);
  });

  test("TC-T06 | should read entire row data", async () => {
    // Get all cell values from first row
    const rowData = await tablePage.getRowData(0);

    // Row should have multiple columns
    expect(rowData.length).toBeGreaterThan(0);

    // Verify each cell has content
    rowData.forEach((cell) => {
      expect(cell.trim().length).toBeGreaterThan(0);
    });
  });

  test("TC-T07 | should read all table data as 2D array", async () => {
    // 📖 CONCEPT: .all() returns array of locators you can loop through
    // https://playwright.dev/docs/api/class-locator#locator-all
    const allData = await tablePage.getAllTableData();

    // Verify we got data
    expect(allData.length).toBeGreaterThan(0);
    expect(allData[0].length).toBeGreaterThan(0);

    // Log the data structure for learning
    console.log("Table data:", allData);
  });

  test("TC-T08 | should access specific row using nth()", async () => {
    // 📖 TEACHING POINT: .nth() is how you get a specific element
    // from a list of matching elements

    // Get the 3rd row (index 2)
    const row = tablePage.getRow(2);

    // Verify row exists
    await expect(row).toBeVisible();

    // Get its first cell
    const firstCell = row.locator("td").nth(0);
    await expect(firstCell).toBeVisible();
  });

  // ══════════════════════════════════════════════════════════
  // ✅ SEARCHING & FILTERING
  // ══════════════════════════════════════════════════════════

  test("TC-T09 | should find row by cell content", async () => {
    // Get first row data to search for
    const firstRowData = await tablePage.getRowData(0);
    const searchText = firstRowData[0]; // First column value

    // Find row containing that text
    const rowIndex = await tablePage.findRowIndexByCellContent(0, searchText);

    // Should find it (row 0)
    expect(rowIndex).toBe(0);
  });

  test("TC-T10 | should find row by any column content", async () => {
    // Get some text from the first row
    const firstRowData = await tablePage.getRowData(0);
    const searchText = firstRowData[1]; // Second column value

    // Find row containing that text anywhere
    const rowIndex = await tablePage.findRowByContent(searchText);

    expect(rowIndex).toBeGreaterThanOrEqual(0);
  });

  test("TC-T11 | should return -1 when row not found", async () => {
    // Search for non-existent content
    const rowIndex = await tablePage.findRowByContent(
      "THIS_DOES_NOT_EXIST_12345",
    );

    expect(rowIndex).toBe(-1);
  });

  // ══════════════════════════════════════════════════════════
  // ✅ EXTRACTING COLUMN DATA
  // ══════════════════════════════════════════════════════════

  test("TC-T12 | should get all values from a specific column", async () => {
    // Extract all values from column 0 (first column)
    const columnData = await tablePage.getColumnData(0);

    // Should have as many values as rows
    const rowCount = await tablePage.getRowCount();
    expect(columnData.length).toBe(rowCount);

    // No empty values
    columnData.forEach((value) => {
      expect(value.trim().length).toBeGreaterThan(0);
    });
  });

  test("TC-T13 | should verify column data types", async () => {
    // If you have a column with numbers, verify they're numeric
    const allData = await tablePage.getAllTableData();

    // Check if any column contains numeric data
    const hasNumericColumn = allData.some((row) =>
      row.some((cell) => !isNaN(parseFloat(cell)) && cell.trim() !== ""),
    );

    // This is just a demonstration - actual assertion depends on your table
    console.log("Has numeric column:", hasNumericColumn);
  });

  // ══════════════════════════════════════════════════════════
  // ✅ SORTING TESTS
  // ══════════════════════════════════════════════════════════

  test("TC-T14 | should sort table by clicking column header", async ({
    page,
  }) => {
    // Get headers to find sortable column
    const headers = await tablePage.getHeaders();

    // Click the first header to sort
    if (headers.length > 0) {
      const headerName = headers[0].trim();

      // Get data before sort
      const beforeSort = await tablePage.getColumnData(0);

      // Click header to sort
      await tablePage.clickColumnHeader(headerName);

      // Wait for table to re-render
      await page.waitForTimeout(500);

      // Get data after sort
      const afterSort = await tablePage.getColumnData(0);

      // Verify data changed (sorting happened)
      // Note: This assumes clicking sorts. Some tables toggle sort direction.
      expect(
        JSON.stringify(beforeSort) !== JSON.stringify(afterSort) ||
          beforeSort.length === 0,
      ).toBe(true);
    }
  });

  test("TC-T15 | should verify if column is sorted", async () => {
    // Get column data
    const columnData = await tablePage.getColumnData(0);

    // Check if it's sorted
    const isAscending = await tablePage.isColumnSortedAscending(0);
    const isDescending = await tablePage.isColumnSortedDescending(0);

    // It should be either sorted ascending, descending, or not sorted
    console.log("Column sorted ascending:", isAscending);
    console.log("Column sorted descending:", isDescending);
  });

  // ══════════════════════════════════════════════════════════
  // ✅ ROW ACTIONS (Edit, Delete, etc.)
  // ══════════════════════════════════════════════════════════

  test("TC-T16 | should click action button in specific row", async ({
    page,
  }) => {
    // If your table has Edit/Delete links
    // This demonstrates how to click them

    // Find row with specific content
    const rowIndex = 0; // First row for demo

    // Check if row has action links
    const row = tablePage.getRow(rowIndex);
    const hasEdit =
      (await row.getByRole("link", { name: /edit/i }).count()) > 0;

    if (hasEdit) {
      await tablePage.clickActionInRow(rowIndex, "Edit");

      // Verify navigation or modal opened
      // This depends on your application
    } else {
      console.log("No Edit action found in this table");
    }
  });

  test("TC-T17 | should click specific cell", async ({ page }) => {
    // Click on a specific cell
    await tablePage.clickCell(0, 0);

    // Verify the click (depends on what clicking does)
    // Maybe cell becomes editable, or opens a detail view
  });

  // ══════════════════════════════════════════════════════════
  // ✅ ADVANCED: LOOPING THROUGH ALL ROWS
  // ══════════════════════════════════════════════════════════

  test("TC-T18 | should loop through all rows and verify structure", async () => {
    const rowCount = await tablePage.getRowCount();
    const expectedColumnCount = await tablePage.getColumnCount();

    // Loop through each row
    for (let i = 0; i < rowCount; i++) {
      const rowData = await tablePage.getRowData(i);

      // Verify each row has the correct number of columns
      expect(rowData.length).toBe(expectedColumnCount);

      // Verify no cell is empty (optional check)
      rowData.forEach((cell, colIndex) => {
        expect(cell.trim().length).toBeGreaterThan(0);
      });
    }
  });

  test("TC-T19 | should use .all() to process all rows", async () => {
    // 📖 POINT: .all() returns array of Locator objects
    // You can then loop through them
    const rows = await tablePage.tableRows.all();

    let totalCells = 0;

    // Process each row
    for (const row of rows) {
      const cells = await row.locator("td").count();
      totalCells += cells;
    }

    // Verify we counted cells
    expect(totalCells).toBeGreaterThan(0);
    console.log(`Total cells in table: ${totalCells}`);
  });

  // ══════════════════════════════════════════════════════════
  // ✅ EDGE CASES
  // ══════════════════════════════════════════════════════════

  test("TC-T20 | should handle empty cells gracefully", async () => {
    // Some tables have empty cells (like optional fields)
    // Verify your code doesn't break
    const allData = await tablePage.getAllTableData();

    allData.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        // Cell can be empty string, which is fine
        expect(cell).toBeDefined();
      });
    });
  });
});

// ============================================================
// 📖 KEY TAKEAWAYS
// ============================================================
//
// ✅ Table Navigation:
//    - .count() → number of elements
//    - .nth(index) → get specific element
//    - .all() → get array of locators
//    - .allTextContents() → array of text
//
// ✅ Common Patterns:
//    - Loop through rows with for loop
//    - Find row by content
//    - Extract column data
//    - Verify sorting
//    - Click actions in specific rows
//
// ✅ Best Practices:
//    - Always verify row/column count first
//    - Handle empty cells gracefully
//    - Use .nth() for specific rows
//    - Use .all() when you need to loop
//    - Add waits after sorting/filtering
//
// ============================================================
