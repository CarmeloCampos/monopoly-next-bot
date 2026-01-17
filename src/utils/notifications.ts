import { type Telegram } from "telegraf";
import { getText } from "@/i18n";
import { DEFAULT_LANGUAGE } from "@/constants";
import { type Language, type MaybeOptional, isLanguage } from "@/types";
import { info, warn } from "@/utils/logger";

export async function sendReferralNotification(
  telegram: Telegram,
  userId: number,
  amount: number,
  level: number,
  language: MaybeOptional<Language>,
): Promise<void> {
  const finalLang: Language =
    language && isLanguage(language) ? language : DEFAULT_LANGUAGE;

  const message = getText(finalLang, "referral_notification")
    .replace("{amount}", String(amount))
    .replace("{level}", String(level));

  try {
    await telegram.sendMessage(userId, message);
    info("Referral notification sent", {
      userId,
      amount,
      level,
      language: finalLang,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    warn("Failed to send referral notification", {
      userId,
      error: errorMessage,
    });
  }
}
