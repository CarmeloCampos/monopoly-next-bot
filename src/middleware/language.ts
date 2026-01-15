import type { Middleware } from "telegraf";
import type { BotContext } from "@/types";
import {
  getText,
  getSupportedLanguages,
  getLanguageName,
  hasLanguage,
  LANGUAGE_CALLBACK_PATTERN,
} from "@/i18n";
import type { InlineKeyboardMarkup } from "telegraf/types";

const languageEmojis: Record<string, string> = {
  ru: "🇷🇺",
  en: "🇬🇧",
  es: "🇪🇸",
  pt: "🇧🇷",
};

const isLanguageSelection = (ctx: BotContext): boolean => {
  if (
    ctx.callbackQuery &&
    "data" in ctx.callbackQuery &&
    ctx.callbackQuery.data
  ) {
    return LANGUAGE_CALLBACK_PATTERN.test(ctx.callbackQuery.data);
  }
  return false;
};

export const languageMiddleware: Middleware<BotContext> = async (ctx, next) => {
  if (!ctx.dbUser) return next();

  if (hasLanguage(ctx.dbUser.language)) return next();

  if (isLanguageSelection(ctx)) {
    return next();
  }

  const inlineKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: getSupportedLanguages().map((lang) => [
      {
        text: languageEmojis[lang] + " " + getLanguageName(lang),
        callback_data: "lang_" + lang,
      },
    ]),
  };

  await ctx.reply(getText(null, "language_selection"), {
    reply_markup: inlineKeyboard,
  });
};
