import type { InlineKeyboardMarkup } from "telegraf/types";
import type {
  Language,
  MaybeOptional,
  WithdrawalCurrency,
  WithdrawalStatus,
} from "@/types";
import { getText } from "@/i18n";
import { CALLBACK_DATA, WITHDRAWAL_CURRENCIES } from "@/constants/bot";
import { getCurrencyDisplayName } from "@/services/withdrawal";
import { createPaginationButtons } from "./pagination";

const CURRENCY_EMOJIS: Record<WithdrawalCurrency, string> = {
  bitcoin: "₿",
  usdt_tron: "💎",
  monero: "🔒",
};

export function getCurrencySelectionKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  const currencyButtons = WITHDRAWAL_CURRENCIES.map((currency) => ({
    text: `${CURRENCY_EMOJIS[currency]} ${getCurrencyDisplayName(currency)}`,
    callback_data: `withdrawal_currency_${currency}`,
  }));

  return {
    inline_keyboard: [
      ...currencyButtons.map((btn) => [btn]),
      [
        {
          text: getText(language, "btn_cancel"),
          callback_data: CALLBACK_DATA.WITHDRAWAL_CANCEL,
        },
      ],
    ],
  };
}

export function getWithdrawalConfirmationKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "btn_confirm"),
          callback_data: "withdrawal_confirm",
        },
        {
          text: getText(language, "btn_cancel"),
          callback_data: CALLBACK_DATA.WITHDRAWAL_CANCEL,
        },
      ],
    ],
  };
}

export function getWithdrawalHistoryKeyboard(
  language: MaybeOptional<Language>,
  currentPage: number,
  hasMore: boolean,
): InlineKeyboardMarkup {
  const buttons = createPaginationButtons(
    { currentPage, hasMore },
    {
      prevData: "withdrawal_history_{page}",
      nextData: "withdrawal_history_{page}",
      backButton: {
        text: getText(language, "btn_back"),
        callbackData: CALLBACK_DATA.WITHDRAWAL_MENU,
      },
    },
  );

  return {
    inline_keyboard: buttons,
  };
}

const STATUS_EMOJIS: Record<WithdrawalStatus, string> = {
  pending: "⏳",
  processed: "✅",
  cancelled: "❌",
  refunded: "🔄",
};

const STATUS_KEYS: Record<WithdrawalStatus, string> = {
  pending: "withdrawal_status_pending",
  processed: "withdrawal_status_processed",
  cancelled: "withdrawal_status_cancelled",
  refunded: "withdrawal_status_refunded",
};

export function getStatusDisplay(
  status: WithdrawalStatus,
  language: MaybeOptional<Language>,
): string {
  const emoji = STATUS_EMOJIS[status] ?? "❓";
  const key = STATUS_KEYS[status] ?? "unknown";
  return `${emoji} ${getText(language, key)}`;
}

export function getBalanceSubmenuKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "withdrawal_create_button"),
          callback_data: CALLBACK_DATA.WITHDRAWAL_CREATE,
        },
        {
          text: getText(language, "withdrawal_history_button"),
          callback_data: CALLBACK_DATA.WITHDRAWAL_HISTORY,
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
