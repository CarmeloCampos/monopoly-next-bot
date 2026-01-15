export const LANGUAGE_EMOJIS: Record<"ru" | "en" | "es" | "pt", string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  es: "🇪🇸",
  pt: "🇧🇷",
};

export const LANGUAGE_NAMES: Record<"ru" | "en" | "es" | "pt", string> = {
  ru: "Русский",
  en: "English",
  es: "Español",
  pt: "Português",
};

export const CHANNEL_URLS = {
  official: "https://t.me/monopolyfunbot_channel",
  community: "https://t.me/monopolyfunbot_chat",
  news: "https://t.me/monopolyfunbot_news",
} as const;

export const DEFAULT_LANGUAGE = "en" as const;

export const REFERRAL_CODE_REGEX = /^\/start\s+(\S+)$/;
