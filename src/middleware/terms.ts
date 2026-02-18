import type { Middleware } from "telegraf";
import { hasLanguage, hasTerms, type BotContext } from "@/types";
import { getText } from "@/i18n";
import type { InlineKeyboardMarkup } from "telegraf/types";
import { CALLBACK_DATA } from "@/constants";

const isTermsAction = (ctx: BotContext): boolean => {
  const { callbackQuery } = ctx;
  return Boolean(
    callbackQuery &&
    "data" in callbackQuery &&
    callbackQuery.data &&
    (CALLBACK_DATA.TERMS_ACCEPT === callbackQuery.data ||
      CALLBACK_DATA.TERMS_DECLINE === callbackQuery.data),
  );
};

export const termsMiddleware: Middleware<BotContext> = async (ctx, next) => {
  if (!hasLanguage(ctx)) return next();
  if (hasTerms(ctx)) return next();
  if (isTermsAction(ctx)) return next();

  const inlineKeyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: getText(ctx.dbUser.language, "terms_accept"),
          callback_data: CALLBACK_DATA.TERMS_ACCEPT,
        },
        {
          text: getText(ctx.dbUser.language, "terms_decline"),
          callback_data: CALLBACK_DATA.TERMS_DECLINE,
        },
      ],
    ],
  };

  await ctx.reply(getText(ctx.dbUser.language, "terms_title"), {
    reply_markup: inlineKeyboard,
    parse_mode: "Markdown",
  });

  await ctx.reply(getText(ctx.dbUser.language, "terms_message"), {
    parse_mode: "Markdown",
  });
};
