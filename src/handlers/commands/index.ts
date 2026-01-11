import { Telegraf } from "telegraf";
import type { BotContext } from "@/types";
import { info } from "@/utils/logger";

export const registerCommands = (bot: Telegraf<BotContext>): void => {
  bot.command("start", (ctx: BotContext) => {
    info("Start command received", { userId: ctx.from?.id });
    ctx.reply(
      "👋 Welcome to Monopoly Bot!\n\n" +
        "This bot helps you play Monopoly games with your friends.\n\n" +
        "Use /help to see available commands.",
    );
  });

  bot.command("help", (ctx: BotContext) => {
    info("Help command received", { userId: ctx.from?.id });
    ctx.reply(
      "📚 *Available Commands:*\n\n" +
        "/start - Start bot\n" +
        "/help - Show this help message\n\n" +
        "More commands coming soon!",
      { parse_mode: "Markdown" },
    );
  });
};
