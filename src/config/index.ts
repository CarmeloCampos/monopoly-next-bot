import { env } from "./env";
import type { LogLevel } from "@/utils/logger";

interface Config {
  botToken: string;
  logLevel: LogLevel;
  executionMode: "polling" | "webhook";
  webhookUrl?: string;
  port: number;
}

/**
 * Application configuration derived from Zod-validated environment variables.
 * All validation is handled by env.ts using Zod schema.
 */
const config: Config = {
  botToken: env.BOT_TOKEN,
  logLevel: env.LOG_LEVEL,
  executionMode: env.EXECUTION_MODE,
  webhookUrl: env.WEBHOOK_URL,
  port: env.PORT,
};

export default config;
export { env };
