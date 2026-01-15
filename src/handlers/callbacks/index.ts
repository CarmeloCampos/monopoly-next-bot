import { Telegraf } from "telegraf";
import { type BotContext, hasDbUser, isLanguage } from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getText } from "@/i18n";
import {
  getMainMenuKeyboard,
  getLanguageKeyboard,
  getChannelsKeyboard,
  getSettingsKeyboard,
} from "@/keyboards";
import { info, error as logError } from "@/utils/logger";
import {
  answerUserNotFound,
  answerInvalidCallback,
} from "@/utils/callback-helpers";
import { CALLBACK_PATTERNS, CALLBACK_DATA } from "@/constants";

export const registerCallbacks = (bot: Telegraf<BotContext>): void => {
  bot.action(CALLBACK_PATTERNS.LANGUAGE, async (ctx: BotContext) => {
    const { callbackQuery } = ctx;

    if (!callbackQuery || !("data" in callbackQuery) || !callbackQuery.data) {
      await answerInvalidCallback(ctx);
      return;
    }

    const langMatch = callbackQuery.data.match(CALLBACK_PATTERNS.LANGUAGE);
    if (!langMatch) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, langValue] = langMatch;
    if (!isLanguage(langValue)) {
      await ctx.answerCbQuery(getText("en", "error_invalid_language"));
      return;
    }

    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    const { dbUser } = ctx;

    try {
      await db
        .update(users)
        .set({
          language: langValue,
          updated_at: new Date(),
        })
        .where(eq(users.telegram_id, dbUser.telegram_id));

      dbUser.language = langValue;

      info("Language updated", {
        userId: dbUser.telegram_id,
        language: langValue,
      });

      await ctx.answerCbQuery();
      await ctx.reply(getText(langValue, "language_selected"));

      const message = getText(langValue, "welcome_new_user");
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: getMainMenuKeyboard(langValue),
      });
      await ctx.deleteMessage();
    } catch (err) {
      logError("Error updating language", {
        userId: dbUser.telegram_id,
        error: err instanceof Error ? err.message : String(err),
      });
      await ctx.answerCbQuery(getText("en", "error_updating_language"));
    }
  });

  bot.action(CALLBACK_DATA.SETTINGS_LANGUAGE, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "language_selection"),
      {
        reply_markup: getLanguageKeyboard(),
      },
    );
  });

  bot.action(CALLBACK_DATA.SETTINGS_CHANNELS, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      getText(ctx.dbUser.language, "settings_channels"),
      {
        reply_markup: getChannelsKeyboard(ctx.dbUser.language),
      },
    );
  });

  bot.action(CALLBACK_DATA.SETTINGS_SUPPORT, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await ctx.answerCbQuery();
    await ctx.reply(getText(ctx.dbUser.language, "settings_support_message"));
  });

  bot.action(CALLBACK_DATA.SETTINGS_BACK, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    await ctx.answerCbQuery();
    await ctx.editMessageText(getText(ctx.dbUser.language, "menu_settings"), {
      reply_markup: getSettingsKeyboard(ctx.dbUser.language),
    });
  });

  bot.action(CALLBACK_DATA.SETTINGS_CLOSE, async (ctx: BotContext) => {
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
  });
};
