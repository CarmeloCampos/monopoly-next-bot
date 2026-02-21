import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  // Turso DB
  TURSO_DATABASE_URL: z.url(),
  TURSO_AUTH_TOKEN: z.string(),

  // Telegram Bot
  BOT_TOKEN: z.string(),

  // Bot execution mode (polling or webhook)
  EXECUTION_MODE: z.enum(["polling", "webhook"]).default("polling"),

  // Webhook URL (required when EXECUTION_MODE=webhook)
  WEBHOOK_URL: z.string().url().optional(),

  // Debug logs
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Cron Server Configuration
  CRON_PORT: z.coerce.number().default(3001),
  CRON_SECRET: z.string(),

  // Admin Configuration
  ADMIN_USER_IDS: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => !Number.isNaN(id)),
    )
    .default([]),

  // Withdrawal Configuration
  MINIMUM_WITHDRAWAL_MC: z.coerce.number().default(10000),
  WITHDRAWAL_COOLDOWN_DAYS: z.coerce.number().default(7),

  // Deposit Configuration
  MINIMUM_DEPOSIT_USD: z.coerce.number().default(10),

  // NOWPayments Configuration
  NOWPAYMENTS_API_KEY: z.string(),
  NOWPAYMENTS_IPN_SECRET: z.string(),
  NOWPAYMENTS_API_URL: z
    .string()
    .url()
    .default("https://api.nowpayments.io/v1"),
  NOWPAYMENTS_IPN_URL: z.string().url(),

  // Bot Configuration
  BOT_USERNAME: z.string().default("MonopolyFunBot"),
  BOT_DISPLAY_NAME: z.string().default("Monopoly Bot"),

  // Terms & Conditions
  TERMS_URL: z.string().url(),

  // Support Contact
  SUPPORT_USERNAME: z.string().default("MonopolyFunBotSupport"),

  // Channel URLs
  CHANNEL_OFFICIAL_URL: z
    .string()
    .url()
    .default("https://t.me/monopolyfunbot_channel"),
  CHANNEL_COMMUNITY_URL: z
    .string()
    .url()
    .default("https://t.me/monopolyfunbot_chat"),
  CHANNEL_NEWS_URL: z
    .string()
    .url()
    .default("https://t.me/monopolyfunbot_news"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Validación de variables de entorno fallida:");
  console.error(z.treeifyError(_env.error));
  throw new Error(
    "Las variables de entorno no son válidas. Revisa el archivo .env",
  );
}

if (_env.data.EXECUTION_MODE === "webhook" && !_env.data.WEBHOOK_URL) {
  console.error("❌ WEBHOOK_URL es obligatorio cuando EXECUTION_MODE=webhook");
  throw new Error("WEBHOOK_URL es obligatorio cuando EXECUTION_MODE=webhook");
}

export const env = _env.data;
