import { test, expect } from "@playwright/test";
import { json_contentType } from "../../api/basePaths";
import {
  Success_Status_Code,
  Create_Success_Status_Code,
} from "../../api/statusCodes";

test.describe("ReqRes - Create new employee", () => {
  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("As an api user i want to create a new employee")
  // @Severity(SeverityLevel.CRITICAL)
  // public void createEmployeeTests()
  // ══════════════════════════════════════════════════════════
  test("createEmployeeTests", async ({ request }) => {
    // createEmployeeResponse()
    const response = await request.post(
      "https://jsonplaceholder.typicode.com/users",
      {
        headers: {
          "Content-Type": json_contentType,
        },
        data: {
          name: "Nkosi",
          job: "Test",
        },
      },
    );

    // .statusCode(Create_Success_Status_Code)
    expect(response.status()).toBe(Create_Success_Status_Code);
  });

  // ══════════════════════════════════════════════════════════
  // Java:
  // @Test
  // @Description("As an api user i want to get employee details")
  // @Severity(SeverityLevel.CRITICAL)
  // public void getEmployeeTests()
  // ══════════════════════════════════════════════════════════
  test("getEmployeeTests", async ({ request }) => {
    // getEmployeedetailsResponse()
    const response = await request.get(
      "https://jsonplaceholder.typicode.com/users",
    );

    // .statusCode(Success_Status_Code)
    expect(response.status()).toBe(Success_Status_Code);
  });
});
