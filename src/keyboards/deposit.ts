/**
 * Deposit keyboards
 */

import type { InlineKeyboardMarkup } from "telegraf/types";
import type { Language, MaybeOptional, DepositStatus } from "@/types";
import { getText } from "@/i18n";
import { CALLBACK_DATA, AVAILABLE_CRYPTO_CURRENCIES } from "@/constants/bot";

import { getDepositStatusDisplay as getDepositStatusText } from "@/services/deposit";
import { createPaginationButtons } from "./pagination";

export function getDepositMenuKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "deposit_create_button"),
          callback_data: CALLBACK_DATA.DEPOSIT_CREATE,
        },
        {
          text: getText(language, "deposit_history_button"),
          callback_data: CALLBACK_DATA.DEPOSIT_HISTORY,
        },
      ],
      [
        {
          text: getText(language, "btn_back"),
          callback_data: CALLBACK_DATA.SETTINGS_CLOSE,
        },
      ],
    ],
  };
}

export function getDepositCancelKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "btn_cancel"),
          callback_data: CALLBACK_DATA.DEPOSIT_CANCEL,
        },
      ],
    ],
  };
}

export function getDepositHistoryKeyboard(
  language: MaybeOptional<Language>,
  currentPage: number,
  hasMore: boolean,
): InlineKeyboardMarkup {
  const buttons = createPaginationButtons(
    { currentPage, hasMore },
    {
      prevData: "deposit_history_{page}",
      nextData: "deposit_history_{page}",
      backButton: {
        text: getText(language, "btn_back"),
        callbackData: CALLBACK_DATA.DEPOSIT_MENU,
      },
    },
  );

  return {
    inline_keyboard: buttons,
  };
}

const STATUS_EMOJIS: Record<DepositStatus, string> = {
  pending: "⏳",
  paid: "✅",
  failed: "❌",
  expired: "⌛",
};

export function getDepositStatusDisplay(
  status: DepositStatus,
  language: MaybeOptional<Language>,
): string {
  const emoji = STATUS_EMOJIS[status] ?? "❓";
  // Use nullish coalescing for safe default
  const safeLanguage = language ?? "en";
  const text = getDepositStatusText(status, safeLanguage);
  return `${emoji} ${text}`;
}

export function getCryptoSelectionKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  // Create rows of 2 buttons each using all available currencies
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < AVAILABLE_CRYPTO_CURRENCIES.length; i += 2) {
    const row = [];
    const first = AVAILABLE_CRYPTO_CURRENCIES[i];
    if (first) {
      row.push({
        text: `${first.symbol} (${first.network})`,
        callback_data: `deposit_crypto_${first.code}`,
      });
    }
    const second = AVAILABLE_CRYPTO_CURRENCIES[i + 1];
    if (second) {
      row.push({
        text: `${second.symbol} (${second.network})`,
        callback_data: `deposit_crypto_${second.code}`,
      });
    }
    rows.push(row);
  }

  // Add back button
  rows.push([
    {
      text: getText(language, "btn_back"),
      callback_data: CALLBACK_DATA.DEPOSIT_CRYPTO_BACK,
    },
  ]);

  return {
    inline_keyboard: rows,
  };
}
