import type { Language } from "@/types/branded";
import { env } from "@/config/env";

export * from "./bot";
export * from "./game";
export * from "./properties";

export const LANGUAGE_EMOJIS: Record<Language, string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  es: "🇪🇸",
  pt: "🇧🇷",
} as const;

export const LANGUAGE_NAMES: Record<Language, string> = {
  ru: "Русский",
  en: "English",
  es: "Español",
  pt: "Português",
} as const;

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  "ru",
  "en",
  "es",
  "pt",
] as const;

export const CHANNEL_URLS = {
  official: env.CHANNEL_OFFICIAL_URL,
  community: env.CHANNEL_COMMUNITY_URL,
  news: env.CHANNEL_NEWS_URL,
} as const;

export const DEFAULT_LANGUAGE: Language = "en";

// Bot configuration from environment variables
export const BOT_CONFIG = {
  username: env.BOT_USERNAME,
  displayName: env.BOT_DISPLAY_NAME,
  supportUsername: env.SUPPORT_USERNAME,
} as const;
