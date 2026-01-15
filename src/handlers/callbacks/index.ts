import { Telegraf } from "telegraf";
import type { BotContext } from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getText,
  buildWelcomeMessage,
  isLanguage,
  LANGUAGE_CALLBACK_PATTERN,
} from "@/i18n";
import { info, error as logError } from "@/utils/logger";

export const registerCallbacks = (bot: Telegraf<BotContext>): void => {
  bot.action(/^lang_(.+)$/, async (ctx: BotContext) => {
    const { callbackQuery, dbUser } = ctx;

    if (!callbackQuery || !("data" in callbackQuery) || !callbackQuery.data) {
      await ctx.answerCbQuery("Invalid callback");
      return;
    }

    const langMatch = callbackQuery.data.match(LANGUAGE_CALLBACK_PATTERN);
    if (!langMatch) {
      await ctx.answerCbQuery("Invalid language");
      return;
    }

    const [, langValue] = langMatch;
    if (!isLanguage(langValue)) {
      await ctx.answerCbQuery("Invalid language");
      return;
    }

    if (!dbUser) {
      await ctx.answerCbQuery("User not found");
      return;
    }

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

      const message = buildWelcomeMessage(langValue, dbUser.referral_code);
      await ctx.reply(message, { parse_mode: "Markdown" });
      await ctx.deleteMessage();
    } catch (err) {
      logError("Error updating language", {
        userId: dbUser.telegram_id,
        error: err instanceof Error ? err.message : String(err),
      });
      await ctx.answerCbQuery("Error updating language");
    }
  });
};
