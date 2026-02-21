import { getText } from "@/i18n";
import type { Language, MaybeOptional } from "@/types";
import { isLanguage } from "@/utils/guards";
import { error } from "@/utils/logger";
import type { Telegram } from "telegraf";

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
    await telegram.sendMessage(
      userId,
      getText(finalLanguage, "deposit_paid_notification")
        .replace("{amount_usd}", String(deposit.amountUsd))
        .replace("{amount_mc}", String(deposit.amountMc)),
    );
  } catch (err) {
    error("Failed to notify user about paid deposit", {
      userId,
      amountUsd: deposit.amountUsd,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
