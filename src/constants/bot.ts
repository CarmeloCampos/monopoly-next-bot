export const CALLBACK_DATA = {
  SETTINGS_LANGUAGE: "settings_language",
  SETTINGS_CHANNELS: "settings_channels",
  SETTINGS_SUPPORT: "settings_support",
  SETTINGS_BACK: "settings_back",
  SETTINGS_CLOSE: "settings_close",
} as const;

export const CALLBACK_PATTERNS = {
  LANGUAGE: /^lang_(ru|en|es|pt)$/,
  START_REFERRAL: /^\/start\s+(\S+)$/,
} as const;
