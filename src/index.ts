import { Telegraf } from "telegraf";
import config from "@/config";
import { setLogLevel, info, error } from "@/utils/logger";
import type { BotContext } from "@/types";
import { registerCommands } from "@/handlers/commands";
import { registerCallbacks } from "@/handlers/callbacks";
import { autoUserMiddleware } from "@/middleware/auto-user";
import { languageMiddleware } from "@/middleware/language";
import { startPolling, startWebhook } from "@/bot/launcher";

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

bot.use(autoUserMiddleware);
bot.use(languageMiddleware);

registerCommands(bot);
registerCallbacks(bot);

bot.catch((err, ctx) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;
  error("Error handling update", {
    error: errorMessage,
    stack: errorStack,
    updateId: ctx.update.update_id,
  });
  ctx.reply("❌ An error occurred. Please try again.");
});

if (config.executionMode === "webhook") {
  if (!config.webhookUrl) {
    throw new Error("WEBHOOK_URL is required when EXECUTION_MODE=webhook");
  }
  startWebhook({
    bot,
    webhookUrl: config.webhookUrl,
    port: config.port,
  });
} else {
  startPolling({ bot });
}
