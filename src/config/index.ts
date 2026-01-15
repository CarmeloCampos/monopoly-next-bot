import { env } from "./env";
import type { LogLevel } from "@/utils/logger";

interface Config {
  botToken: string;
  logLevel: LogLevel;
}

/**
 * Application configuration derived from Zod-validated environment variables.
 * All validation is handled by env.ts using Zod schema.
 */
const config: Config = {
  botToken: env.BOT_TOKEN,
  logLevel: env.LOG_LEVEL,
};

export default config;
export { env };
