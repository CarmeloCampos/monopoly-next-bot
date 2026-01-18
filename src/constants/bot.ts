export const CALLBACK_DATA = {
  SETTINGS_LANGUAGE: "settings_language",
  SETTINGS_CHANNELS: "settings_channels",
  SETTINGS_SUPPORT: "settings_support",
  SETTINGS_BACK: "settings_back",
  SETTINGS_CLOSE: "settings_close",
  PROPERTY_CLAIM: "property_claim",
  PROPERTY_CLOSE: "property_close",
  PROPERTY_BACK: "property_back",
  PROPERTY_UPGRADE: "property_upgrade",
  BOARD_BUY_PROPERTY: "board_buy_property",
  BOARD_BUY_SERVICE: "board_buy_service",
  SERVICE_CLOSE: "service_close",
  SERVICE_BACK: "service_back",
} as const;

export const CALLBACK_PATTERNS = {
  LANGUAGE: /^lang_(ru|en|es|pt)$/,
  START_REFERRAL: /^\/start\s+(\S+)$/,
  PROPERTY_NAV: /^property_nav_(\d+)$/,
  PROPERTY_CLAIM: /^property_claim_(\d+)$/,
  PROPERTY_UPGRADE: /^property_upgrade_(\d+)$/,
  SERVICE_NAV: /^service_nav_(\d+)$/,
  BOARD_BUY_PROPERTY: /^board_buy_property_(\d+)$/,
  BOARD_BUY_SERVICE: /^board_buy_service_(\d+)$/,
} as const;
