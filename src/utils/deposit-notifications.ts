import { getText } from "@/i18n";
import type { Language, MaybeOptional } from "@/types";
import { isLanguage } from "@/utils/guards";
import { error } from "@/utils/logger";
import type { Telegram } from "telegraf";
import { formatTelegramText } from "@/utils/telegram-format";
import { sendMarkdownSafe } from "@/utils/telegram-send";

export interface DepositNotificationData {
  amountUsd: number;
  amountMc: number;
}

export async function notifyUserDepositPaid(
  telegram: Telegram,
  userId: number,
  userLanguage: MaybeOptional<Language>,
  deposit: DepositNotificationData,
): Promise<void> {
  const finalLanguage: Language =
    userLanguage && isLanguage(userLanguage) ? userLanguage : "en";

  try {
    const message = formatTelegramText(
      getText(finalLanguage, "deposit_paid_notification"),
      {
        amount_usd: String(deposit.amountUsd),
        amount_mc: String(deposit.amountMc),
      },
    );

    await sendMarkdownSafe(telegram, userId, message);
  } catch (err) {
    error("Failed to notify user about paid deposit", {
      userId,
      amountUsd: deposit.amountUsd,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
