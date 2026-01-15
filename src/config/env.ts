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

  // Debug logs
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Validación de variables de entorno fallida:");
  console.error(z.treeifyError(_env.error));
  throw new Error(
    "Las variables de entorno no son válidas. Revisa el archivo .env",
  );
}

export const env = _env.data;
