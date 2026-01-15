/**
 * Translation locales for multi-language support
 * Main language: Russian (ru)
 * Supported languages: Russian, English, Spanish, Portuguese
 */

import type { Language, MaybeOptional } from "@/types/utils";
import { warn } from "@/utils/logger";

/**
 * Supported language codes
 */
export const SUPPORTED_LANGUAGES: readonly Language[] = [
  "ru",
  "en",
  "es",
  "pt",
] as const;

/**
 * Regex pattern for language callback data
 */
export const LANGUAGE_CALLBACK_PATTERN = /^lang_(ru|en|es|pt)$/;

interface Locales {
  ru: Record<string, string>;
  en: Record<string, string>;
  es: Record<string, string>;
  pt: Record<string, string>;
}

const locales: Locales = {
  ru: {
    language_selection: "Пожалуйста, выберите язык",
    language_selected: "Язык успешно выбран! Добро пожаловать!",
    welcome: "👋 Добро пожаловать в Monopoly Bot!",
    referral_code: "Ваш реферальный код:",
    share_referral: "Поделитесь им с друзьями, чтобы получить награды!",
    help_title: "📚 Доступные команды:",
    cmd_start: "/start - Запустить бота",
    cmd_help: "/help - Показать это сообщение",
    more_commands: "Больше команд скоро!",
  },
  en: {
    language_selection: "Please select your language",
    language_selected: "Language selected successfully! Welcome!",
    welcome: "👋 Welcome to Monopoly Bot!",
    referral_code: "Your referral code:",
    share_referral: "Share it with friends to earn rewards!",
    help_title: "📚 Available Commands:",
    cmd_start: "/start - Start bot",
    cmd_help: "/help - Show this help message",
    more_commands: "More commands coming soon!",
  },
  es: {
    language_selection: "Por favor, selecciona tu idioma",
    language_selected: "¡Idioma seleccionado con éxito! ¡Bienvenido!",
    welcome: "👋 ¡Bienvenido a Monopoly Bot!",
    referral_code: "Tu código de referido:",
    share_referral: "¡Compártelo con amigos para ganar recompensas!",
    help_title: "📚 Comandos disponibles:",
    cmd_start: "/start - Iniciar bot",
    cmd_help: "/help - Mostrar este mensaje de ayuda",
    more_commands: "¡Más comandos pronto!",
  },
  pt: {
    language_selection: "Por favor, selecione seu idioma",
    language_selected: "Idioma selecionado com sucesso! Bem-vindo!",
    welcome: "👋 Bem-vindo ao Monopoly Bot!",
    referral_code: "Seu código de referência:",
    share_referral: "Compartilhe com amigos para ganhar recompensas!",
    help_title: "📚 Comandos disponíveis:",
    cmd_start: "/start - Iniciar bot",
    cmd_help: "/help - Mostrar esta mensagem de ajuda",
    more_commands: "Mais comandos em breve!",
  },
};

/**
 * Type guard to check if a value is a valid Language
 */
export function isLanguage(value: MaybeOptional<string>): value is Language {
  return value === "ru" || value === "en" || value === "es" || value === "pt";
}

/**
 * Get a text translation by key and language
 * Falls back to Russian if key not found in target language
 */
export function getText(
  language: MaybeOptional<Language>,
  key: string,
): string {
  const lang = isLanguage(language) ? language : "ru";
  const translation = locales[lang][key];

  if (!translation) {
    warn("Translation not found", { key, language: lang });
    return key;
  }

  return translation;
}

/**
 * Check if a user has a language set
 */
export function hasLanguage(language: MaybeOptional<Language>): boolean {
  return language !== null && language !== undefined && isLanguage(language);
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): readonly Language[] {
  return SUPPORTED_LANGUAGES;
}

/**
 * Get language display name
 */
export function getLanguageName(lang: Language): string {
  const names: Record<Language, string> = {
    ru: "Русский",
    en: "English",
    es: "Español",
    pt: "Português",
  };
  return names[lang];
}
