export const CALLBACK_DATA = {
  SETTINGS_LANGUAGE: "settings_language",
  SETTINGS_CHANNELS: "settings_channels",
  SETTINGS_SUPPORT: "settings_support",
  SETTINGS_BACK: "settings_back",
  SETTINGS_CLOSE: "settings_close",
  PROPERTY_CLAIM: "property_claim",
  PROPERTY_CLOSE: "property_close",
  PROPERTY_BACK: "property_back",
} as const;

export const CALLBACK_PATTERNS = {
  LANGUAGE: /^lang_(ru|en|es|pt)$/,
  START_REFERRAL: /^\/start\s+(\S+)$/,
  PROPERTY_NAV: /^property_nav_(\d+)$/,
  PROPERTY_CLAIM: /^property_claim_(\d+)$/,
} as const;
