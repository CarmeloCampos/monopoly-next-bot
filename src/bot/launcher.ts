import type { Telegraf, Context } from "telegraf";
import { info, error } from "@/utils/logger";

interface StartPollingParams<T extends Context> {
  bot: Telegraf<T>;
}

interface StartWebhookParams<T extends Context> {
  bot: Telegraf<T>;
  webhookUrl: string;
  port: number;
}

const gracefulShutdown = async <T extends Context>(
  bot: Telegraf<T>,
  signal: string,
): Promise<void> => {
  info(`Received ${signal}, shutting down gracefully...`);
  await bot.stop();
  info("Bot stopped");
  process.exit(0);
};

const setupShutdownHandlers = <T extends Context>(bot: Telegraf<T>): void => {
  process.once("SIGINT", () => gracefulShutdown(bot, "SIGINT"));
  process.once("SIGTERM", () => gracefulShutdown(bot, "SIGTERM"));
};

export function startPolling<T extends Context>({
  bot,
}: StartPollingParams<T>): void {
  info("Starting bot in polling mode...");
  setupShutdownHandlers(bot);

  bot
    .launch()
    .then(() => {
      info("Bot started successfully (polling mode)");
    })
    .catch((err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error("Failed to start bot in polling mode", { error: errorMessage });
      process.exit(1);
    });
}

export function startWebhook<T extends Context>({
  bot,
  webhookUrl,
  port,
}: StartWebhookParams<T>): void {
  info("Starting bot in webhook mode...", { webhookUrl, port });
  setupShutdownHandlers(bot);

  bot
    .launch({
      webhook: {
        domain: webhookUrl,
        hookPath: "/webhook",
        port,
      },
    })
    .then(() => {
      info("Bot started successfully (webhook mode)", {
        webhookUrl,
        hookPath: "/webhook",
        port,
      });
    })
    .catch((err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error("Failed to start bot in webhook mode", { error: errorMessage });
      process.exit(1);
    });
}
