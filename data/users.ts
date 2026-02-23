// ============================================================
// 📖 LECTURE: Test Data Separation
// ============================================================
// Never hard-code credentials inside test files.
// Keep data here → change one place, all tests update.
//
//  - or use .env files (for secrets)
//  - JSON fixtures
//  - Faker.js (random data)
//  - API-created users (setup step)
//
// 📖 PLAYWRIGHT DOC - Test fixtures:
//   https://playwright.dev/docs/test-fixtures
// ============================================================

export const VALID_USER = {
  username: "practice",
  password: "SuperSecretPassword!",
};

// Used for NEGATIVE testing — known bad credentials
export const INVALID_CREDENTIALS = {
  wrongUsername: "wronguser",
  wrongPassword: "wrongpassword",
  emptyString: "",
  sqlInjection: "' OR '1'='1",
  xss: "<script>alert(1)</script>",
};

// For registration tests — we generate unique usernames to
// avoid "already taken" conflicts between test runs
export function uniqueUsername(prefix = "testuser") {
  // Date.now() gives ms since epoch → practically unique
  // Usernames can only contain lowercase letters, numbers, and single hyphens.
  return `${prefix}-${Date.now()}`;
}

// Expected messages from the server
export const MESSAGES = {
  loginSuccess: "You logged into a secure area!",
  logoutSuccess: "You logged out of the secure area!",
  invalidUsername: "Your username is invalid!",
  invalidPassword: "Your password is invalid!",
  registerSuccess: "Successfully registered, you can log in now.",
  passwordMismatch: "Passwords do not match.",
};
