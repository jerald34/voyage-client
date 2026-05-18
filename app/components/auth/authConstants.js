/**
 * Auth-related constants and configuration.
 * Extracted from login/page.jsx.
 */

export const registerValidationErrorCodes = new Set([
  "VALIDATION_ERROR",
  "EMAIL_ALREADY_USED",
  "PASSWORD_TOO_SHORT",
  "DISPLAY_NAME_REQUIRED",
]);

export const passwordSimilarityMessage =
  "Password must be different from your name and email.";

export const agencyLocationOptions = {
  Philippines: [
    "Manila",
    "Olongapo City",
    "Baguio",
    "Cebu",
    "Davao",
    "Boracay",
    "Coron",
    "Subic Bay",
  ],
  Japan: ["Tokyo", "Osaka", "Kyoto", "Fukuoka", "Sapporo"],
  Singapore: ["Singapore"],
  Thailand: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya"],
  Malaysia: ["Kuala Lumpur", "Penang", "Langkawi"],
};

export const agencyCountryOptions = Object.keys(agencyLocationOptions);
