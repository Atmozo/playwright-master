export const ReqRes_baseURL =
  process.env.REQRES_BASE_URL || "https://reqres.in";
export const Weather_baseURL =
  process.env.WEATHER_BASE_URL || "https://api.openweathermap.org";
export const DogsAPI_baseURL =
  process.env.DOGS_BASE_URL || "https://dog.ceo/api";
export const appid = process.env.OPENWEATHER_API_KEY || "";
export let StationID: string = "";
export const json_contentType = "application/json";

export const BasePaths = {
  ReqRes_baseURL,
  Weather_baseURL,
  DogsAPI_baseURL,
  appid,
  StationID,
  json_contentType,
} as const;
