import type { Middleware } from "telegraf";
import { hasLanguage, type BotContext } from "@/types";
import { getText, getSupportedLanguages, getLanguageName } from "@/i18n";
import type { InlineKeyboardMarkup } from "telegraf/types";
import { LANGUAGE_EMOJIS, CALLBACK_PATTERNS } from "@/constants";

const isLanguageSelection = (ctx: BotContext): boolean => {
  const { callbackQuery } = ctx;
  return Boolean(
    callbackQuery &&
    "data" in callbackQuery &&
    callbackQuery.data &&
    CALLBACK_PATTERNS.LANGUAGE.test(callbackQuery.data),
  );
};

export const languageMiddleware: Middleware<BotContext> = async (ctx, next) => {
  if (!ctx.dbUser) return next();
  if (hasLanguage(ctx)) return next();
  if (isLanguageSelection(ctx)) return next();

  const inlineKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: getSupportedLanguages().map((lang) => [
      {
        text: `${LANGUAGE_EMOJIS[lang]} ${getLanguageName(lang)}`,
        callback_data: `lang_${lang}`,
      },
    ]),
  };

  await ctx.reply(getText(null, "language_selection"), {
    reply_markup: inlineKeyboard,
  });
};
