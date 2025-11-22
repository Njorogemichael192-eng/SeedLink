export const MAX_USSD_SEEDLING_QUANTITY = 5;
export const USSD_SESSION_TIMEOUT_MINUTES = 5;

export const USSD_MAX_INVALID_ATTEMPTS = 3;

export const USSD_INVALID_INPUT_PREFIX = "Invalid input. Please try again:";

// Level 0: Welcome menu
export const WELCOME_MENU_TEXT = [
  "Welcome to SeedLinkf331",
  "1. Register",
  "2. Login",
  "00. Exit",
].join("\n");

// Level 2: Main menu after successful registration/login
export const MAIN_MENU_TEXT = [
  "Main Menu:",
  "1. Book Seedlings",
  "2. Join Events",
  "3. Exit",
  "00. Logout",
].join("\n");

// Minimal list of Kenya counties for validation. Extend as needed.
export const KENYA_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Kiambu",
  "Uasin Gishu",
  "Machakos",
  "Kajiado",
  "Murang'a",
  "Nyeri",
  "Meru",
  "Embu",
  "Kilifi",
  "Kwale",
  "Garissa",
  "Wajir",
  "Mandera",
  "Turkana",
  "Busia",
  "Bungoma",
];
