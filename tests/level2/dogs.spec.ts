import { test, expect } from "@playwright/test";
import { DogsAPI_baseURL } from "../../api/basePaths";
import {
  get_List_of_All_Breeds_Status_Code,
  display_Single_Random_Image_Status_Code,
  display_Multiple_Random_Image_Status_Code,
  display_All_Images_By_Breed_Status_Code,
  display_Radom_Image_from_Breed_Status_Code,
  display_Multiple_Images_from_Breed_Status_Code,
  display_List_All_Sub_Breeds_Status_Code,
  display_List_All_Sub_Breeds_Images_Status_Code,
  display_Single_Random_Image_From_Sub_Breed_Status_Code,
  display_Multiple_Images_From_Sub_Breed_Status_Code,
  display_Images_Of_Breed_List_Status_Code,
} from "../../api/statusCodes";

test.describe("DogsAPITests - Get a list of dog breeds", () => {
  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to get a list of all dog breeds")
  // @Severity(SeverityLevel.BLOCKER)
  // ══════════════════════════════════════════════════════════
  test("getListOfAllBreedsTests", async ({ request }) => {
    const response = await request.get(`${DogsAPI_baseURL}/breeds/list/all`);
    expect(response.status()).toBe(get_List_of_All_Breeds_Status_Code);
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to display single random image from all dogs collection")
  // @Severity(SeverityLevel.BLOCKER)
  // ══════════════════════════════════════════════════════════
  test("getSingleRandomImageTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breeds/image/random`,
    );
    expect(response.status()).toBe(display_Single_Random_Image_Status_Code);
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to display a multiple random image from all dogs collection")
  // @Severity(SeverityLevel.CRITICAL)
  // ══════════════════════════════════════════════════════════
  test("getMultipleRandomImageTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breeds/image/random/3`,
    );
    expect(response.status()).toBe(display_Multiple_Random_Image_Status_Code);
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to return an array of all the images from a breed, eg. hound")
  // @Severity(SeverityLevel.CRITICAL)
  // ══════════════════════════════════════════════════════════
  test("getDogsImagesByBreedTests", async ({ request }) => {
    const response = await request.get(`${DogsAPI_baseURL}/breed/hound/images`);
    expect(response.status()).toBe(display_All_Images_By_Breed_Status_Code);
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to return a random dog image from a breed, e.g. hound")
  // @Severity(SeverityLevel.NORMAL)
  // ══════════════════════════════════════════════════════════
  test("getRandomImagesFromBreedTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breed/hound/images/random`,
    );
    expect(response.status()).toBe(display_Radom_Image_from_Breed_Status_Code);
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to return a multiple random dog image from a breed collection, e.g. hound")
  // @Severity(SeverityLevel.NORMAL)
  // ══════════════════════════════════════════════════════════
  test("getMultipleImagesFromBreedTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breed/hound/images/random/3`,
    );
    expect(response.status()).toBe(
      display_Multiple_Images_from_Breed_Status_Code,
    );
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to return an array of all the sub-breeds from a breed")
  // @Severity(SeverityLevel.MINOR)
  // ══════════════════════════════════════════════════════════
  test("getListOfAllSubBreedsTests", async ({ request }) => {
    const response = await request.get(`${DogsAPI_baseURL}/breed/hound/list`);
    expect(response.status()).toBe(display_List_All_Sub_Breeds_Status_Code);
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to return an array of all sub-breeds images from the sub-breed")
  // @Severity(SeverityLevel.CRITICAL)
  // ══════════════════════════════════════════════════════════
  test("getListOfAllSubBreedImagesTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breed/hound/afghan/images`,
    );
    expect(response.status()).toBe(
      display_List_All_Sub_Breeds_Images_Status_Code,
    );
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to return a single random image from a sub-breed collection")
  // @Severity(SeverityLevel.MINOR)
  // ══════════════════════════════════════════════════════════
  test("getSingleRandomImageSubBreedTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breed/hound/afghan/images/random`,
    );
    expect(response.status()).toBe(
      display_Single_Random_Image_From_Sub_Breed_Status_Code,
    );
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to return multiple random image from a sub-breed collection")
  // @Severity(SeverityLevel.NORMAL)
  // ══════════════════════════════════════════════════════════
  test("getMultipleRandomImageSubBreedTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breed/hound/afghan/images/random/3`,
    );
    expect(response.status()).toBe(
      display_Multiple_Images_From_Sub_Breed_Status_Code,
    );
    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  // ══════════════════════════════════════════════════════════
  // @Description("As an api user i want to return a breed list")
  // @Severity(SeverityLevel.NORMAL)
  // ══════════════════════════════════════════════════════════
  test("getBreedListTests", async ({ request }) => {
    const response = await request.get(`${DogsAPI_baseURL}/breeds/list/all`);
    expect(response.status()).toBe(display_Images_Of_Breed_List_Status_Code);
  });
}); // ← closes test.describe

// ============================================================
//  COMPARISON SUMMARY - All 11 Tests Converted
// ============================================================
//
// Java Structure                | Playwright Equivalent
// ------------------------------|---------------------------
// @Feature("DogsAPITests")      | test.describe('DogsAPITests')
// @Story("Get a list...")       | describe name
// @Test                         | test('name', async)
// @Description("...")           | test name
// @Severity(SeverityLevel.X)    | Comment for reference
// given().baseUri()             | request.get(url)
// .when().get("/path")          | await request.get(fullUrl)
// .then().assertThat()          | expect()
// .statusCode(X)                | expect(response.status()).toBe(X)
// .body("key", matcher)         | expect(data.key).toContain()
// .log().all()                  | Auto-logged in reports
// .extract().response()         | const response = await
// ============================================================
