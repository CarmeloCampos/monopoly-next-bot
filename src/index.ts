import { Telegraf } from "telegraf";
import config from "@/config";
import { setLogLevel, info, error } from "@/utils/logger";
import type { BotContext } from "@/types";
import { registerCommands } from "@/handlers/commands";

const isError = (value: unknown): value is Error => {
  return value instanceof Error;
};

setLogLevel(config.logLevel);

info("Initializing bot...", { logLevel: config.logLevel });

const bot = new Telegraf<BotContext>(config.botToken);

bot.use(async (ctx, next) => {
  info("Update received", {
    updateId: ctx.update.update_id,
    updateType: Object.keys(ctx.update)[1],
  });
  await next();
});

registerCommands(bot);

bot.catch((err, ctx) => {
  const errorMessage = isError(err) ? err.message : String(err);
  const errorStack = isError(err) ? err.stack : undefined;
  error("Error handling update", {
    error: errorMessage,
    stack: errorStack,
    updateId: ctx.update.update_id,
  });
  ctx.reply("❌ An error occurred. Please try again.");
});

const gracefulShutdown = async (signal: string): Promise<void> => {
  info(`Received ${signal}, shutting down gracefully...`);
  await bot.stop();
  info("Bot stopped");
  process.exit(0);
};

process.once("SIGINT", () => gracefulShutdown("SIGINT"));
process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));

info("Starting bot in polling mode...");
bot
  .launch()
  .then(() => {
    info("Bot started successfully");
  })
  .catch((err) => {
    const errorMessage = isError(err) ? err.message : String(err);
    error("Failed to start bot", { error: errorMessage });
    process.exit(1);
  });
