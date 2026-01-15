import { Telegraf } from "telegraf";
import type { BotContext } from "@/types";
import { info } from "@/utils/logger";
import { buildWelcomeMessage, buildHelpMessage } from "@/i18n";

export const registerCommands = (bot: Telegraf<BotContext>): void => {
  bot.command("start", async (ctx: BotContext): Promise<void> => {
    info("Start command received", { userId: ctx.from?.id });

    const { dbUser } = ctx;

    if (!dbUser) {
      await ctx.reply("❌ Error: User not found. Please try again.");
      return;
    }

    const message = buildWelcomeMessage(dbUser.language, dbUser.referral_code);
    await ctx.reply(message, { parse_mode: "Markdown" });
  });

  bot.command("help", async (ctx: BotContext): Promise<void> => {
    info("Help command received", { userId: ctx.from?.id });

    const { dbUser } = ctx;

    if (!dbUser) {
      await ctx.reply("❌ Error: User not found. Please try again.");
      return;
    }

    const message = buildHelpMessage(dbUser.language);
    await ctx.reply(message, { parse_mode: "Markdown" });
  });
};
