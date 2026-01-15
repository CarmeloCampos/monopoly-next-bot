import { getText } from "./locales";
import type { Language, MaybeOptional } from "@/types";

export function buildReferralBonusMessage(
  language: MaybeOptional<Language>,
  amount: number,
): string {
  return getText(language, "referral_bonus_received").replace(
    "{amount}",
    String(amount),
  );
}

export function buildReferralLevelMessage(
  language: MaybeOptional<Language>,
  level: number,
): string {
  return getText(language, "referral_level_n").replace(
    "{level}",
    String(level),
  );
}

export function buildBalanceMessage(
  language: MaybeOptional<Language>,
  balance: number,
): string {
  return getText(language, "menu_balance_message").replace(
    "{balance}",
    String(balance),
  );
}

export function buildReferralCodeMessage(
  language: MaybeOptional<Language>,
  code: string,
): string {
  const codeText = getText(language, "menu_referral_code").replace(
    "{code}",
    code,
  );
  const linkText = getText(language, "menu_referral_share_link").replace(
    "{code}",
    code,
  );
  return `${codeText}\n${linkText.trim()}`;
}
