import type { Language } from "@/types/branded";

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
  official: "https://t.me/monopolyfunbot_channel",
  community: "https://t.me/monopolyfunbot_chat",
  news: "https://t.me/monopolyfunbot_news",
} as const;

export const DEFAULT_LANGUAGE: Language = "en";
