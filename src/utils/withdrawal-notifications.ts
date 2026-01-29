import { getText } from "@/i18n";
import type {
  Language,
  WithdrawalId,
  WithdrawalCurrency,
  MaybeOptional,
} from "@/types";
import { getCurrencyDisplayName } from "@/services/withdrawal";
import { isLanguage } from "@/utils/guards";
import { error } from "@/utils/logger";
import type { Telegram } from "telegraf";

export interface WithdrawalNotificationData {
  userId: number;
  amount: number;
  currency: WithdrawalCurrency;
  hash?: string;
}

export async function notifyUserWithdrawalProcessed(
  telegram: Telegram,
  userId: number,
  userLanguage: MaybeOptional<Language>,
  withdrawal: WithdrawalNotificationData,
  transactionHash: string,
): Promise<void> {
  const finalLanguage: Language =
    userLanguage && isLanguage(userLanguage) ? userLanguage : "en";

  try {
    await telegram.sendMessage(
      userId,
      getText(finalLanguage, "withdrawal_processed_notification")
        .replace("{amount}", String(withdrawal.amount))
        .replace("{currency}", getCurrencyDisplayName(withdrawal.currency))
        .replace("{hash}", transactionHash),
    );
  } catch (err) {
    error("Failed to notify user about processed withdrawal", {
      userId,
      withdrawalId: withdrawal.userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function notifyUserWithdrawalCancelled(
  telegram: Telegram,
  userId: number,
  userLanguage: MaybeOptional<Language>,
  withdrawalId: WithdrawalId,
  amount: number,
  isRefund: boolean,
): Promise<void> {
  const finalLanguage: Language =
    userLanguage && isLanguage(userLanguage) ? userLanguage : "en";

  const messageKey = isRefund
    ? "withdrawal_cancelled_notification"
    : "withdrawal_cancelled_notification";

  const logMessage = isRefund
    ? "Failed to notify user about refunded withdrawal"
    : "Failed to notify user about cancelled withdrawal";

  try {
    await telegram.sendMessage(
      userId,
      getText(finalLanguage, messageKey).replace("{amount}", String(amount)),
    );
  } catch (err) {
    error(logMessage, {
      userId,
      withdrawalId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
