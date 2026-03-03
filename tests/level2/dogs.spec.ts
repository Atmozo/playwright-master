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
  test("getListOfAllBreedsTests", async ({ request }) => {
    const response = await request.get(`${DogsAPI_baseURL}/breeds/list/all`);

    expect(response.status()).toBe(get_List_of_All_Breeds_Status_Code);

    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  test("getSingleRandomImageTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breeds/image/random`,
    );

    expect(response.status()).toBe(display_Single_Random_Image_Status_Code);

    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  test("getMultipleRandomImageTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breeds/image/random/3`,
    );

    expect(response.status()).toBe(display_Multiple_Random_Image_Status_Code);

    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  test("getDogsImagesByBreedTests", async ({ request }) => {
    const response = await request.get(`${DogsAPI_baseURL}/breed/hound/images`);

    expect(response.status()).toBe(display_All_Images_By_Breed_Status_Code);

    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

  test("getRandomImagesFromBreedTests", async ({ request }) => {
    const response = await request.get(
      `${DogsAPI_baseURL}/breed/hound/images/random`,
    );

    expect(response.status()).toBe(display_Radom_Image_from_Breed_Status_Code);

    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

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

  test("getListOfAllSubBreedsTests", async ({ request }) => {
    const response = await request.get(`${DogsAPI_baseURL}/breed/hound/list`);

    expect(response.status()).toBe(display_List_All_Sub_Breeds_Status_Code);

    const data = await response.json();
    expect(data.status.toLowerCase()).toContain("success");
  });

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

  test("getBreedListTests", async ({ request }) => {
    const response = await request.get(`${DogsAPI_baseURL}/breeds/list/all`);

    expect(response.status()).toBe(display_Images_Of_Breed_List_Status_Code);
  });
});
