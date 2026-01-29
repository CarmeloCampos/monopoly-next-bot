import type { InlineKeyboardMarkup } from "telegraf/types";
import type { Language, MaybeOptional } from "@/types";
import { getText } from "@/i18n";

export function getReferralDashboardKeyboard(
  language: MaybeOptional<Language>,
  referralCode: string,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "referral_btn_share"),
          switch_inline_query: getText(language, "referral_share_text").replace(
            "{code}",
            referralCode,
          ),
        },
      ],
      [
        {
          text: getText(language, "referral_btn_history"),
          callback_data: "referral_history",
        },
        {
          text: getText(language, "referral_btn_refresh"),
          callback_data: "referral_refresh",
        },
      ],
    ],
  };
}

export function getReferralHistoryKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "btn_back"),
          callback_data: "referral_back",
        },
      ],
    ],
  };
}
