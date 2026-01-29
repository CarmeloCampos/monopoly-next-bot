import { type Telegram } from "telegraf";
import { getText } from "@/i18n";
import { DEFAULT_LANGUAGE } from "@/constants";
import {
  type Language,
  type MaybeOptional,
  isLanguage,
  type WithdrawalCurrency,
} from "@/types";
import { info, warn } from "@/utils/logger";
import { env } from "@/config/env";
import { getCurrencyDisplayName } from "@/services/withdrawal";
import { buildUserDisplayName } from "@/utils/user-display";

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

export async function notifyAdminsNewWithdrawal(
  telegram: Telegram,
  withdrawal: {
    id: number;
    userId: number;
    username: MaybeOptional<string>;
    firstName: MaybeOptional<string>;
    lastName: MaybeOptional<string>;
    amount: number;
    currency: WithdrawalCurrency;
    walletAddress: string;
  },
): Promise<void> {
  const adminIds = env.ADMIN_USER_IDS;

  if (adminIds.length === 0) {
    warn("No admin IDs configured, skipping admin notification", {
      withdrawalId: withdrawal.id,
    });
    return;
  }

  const userDisplayName = buildUserDisplayName({
    telegramId: withdrawal.userId,
    username: withdrawal.username,
    firstName: withdrawal.firstName,
    lastName: withdrawal.lastName,
  });

  const currencyDisplay = getCurrencyDisplayName(withdrawal.currency);

  for (const adminId of adminIds) {
    try {
      const message = getText(
        DEFAULT_LANGUAGE,
        "admin_new_withdrawal_notification",
      )
        .replace("{user}", userDisplayName)
        .replace("{amount}", String(withdrawal.amount))
        .replace("{currency}", currencyDisplay)
        .replace("{wallet}", withdrawal.walletAddress);

      await telegram.sendMessage(adminId, message, { parse_mode: "Markdown" });

      info("Admin notification sent for new withdrawal", {
        adminId,
        withdrawalId: withdrawal.id,
        userId: withdrawal.userId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      warn("Failed to send admin notification", {
        adminId,
        withdrawalId: withdrawal.id,
        error: errorMessage,
      });
    }
  }
}
