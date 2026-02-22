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
import { formatTelegramText } from "@/utils/telegram-format";
import { sendMarkdownSafe } from "@/utils/telegram-send";

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
    const message = formatTelegramText(
      getText(finalLanguage, "withdrawal_processed_notification"),
      {
        amount: String(withdrawal.amount),
        currency: getCurrencyDisplayName(withdrawal.currency),
        hash: transactionHash,
      },
    );

    await sendMarkdownSafe(telegram, userId, message);
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

  const messageKey = "withdrawal_cancelled_notification";
  const logMessage = isRefund
    ? "Failed to notify user about refunded withdrawal"
    : "Failed to notify user about cancelled withdrawal";

  try {
    const message = formatTelegramText(getText(finalLanguage, messageKey), {
      amount: String(amount),
    });

    await sendMarkdownSafe(telegram, userId, message);
  } catch (err) {
    error(logMessage, {
      userId,
      withdrawalId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
