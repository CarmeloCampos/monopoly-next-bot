import type { InlineKeyboardMarkup } from "telegraf/types";
import type { Language, MaybeOptional } from "@/types";
import { getText } from "@/i18n";
import { CALLBACK_DATA } from "@/constants/bot";
import { createPaginationButtons } from "./pagination";

export function getAdminPanelKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "admin_users_button"),
          callback_data: CALLBACK_DATA.ADMIN_USERS,
        },
        {
          text: getText(language, "admin_top_users_button"),
          callback_data: CALLBACK_DATA.ADMIN_TOP_USERS,
        },
      ],
      [
        {
          text: getText(language, "admin_pending_withdrawals_button"),
          callback_data: CALLBACK_DATA.ADMIN_PENDING_WITHDRAWALS,
        },
        {
          text: getText(language, "admin_all_withdrawals_button"),
          callback_data: CALLBACK_DATA.ADMIN_WITHDRAWALS,
        },
      ],
      [
        {
          text: getText(language, "btn_close"),
          callback_data: CALLBACK_DATA.ADMIN_CLOSE,
        },
      ],
    ],
  };
}

export function getAdminUsersKeyboard(
  language: MaybeOptional<Language>,
  currentPage: number,
  hasMore: boolean,
): InlineKeyboardMarkup {
  const buttons = createPaginationButtons(
    { currentPage, hasMore },
    {
      prevData: "admin_users_page_{page}",
      nextData: "admin_users_page_{page}",
      backButton: {
        text: getText(language, "btn_back"),
        callbackData: CALLBACK_DATA.ADMIN_PANEL,
      },
    },
  );

  return {
    inline_keyboard: buttons,
  };
}

export function getAdminWithdrawalActionsKeyboard(
  language: MaybeOptional<Language>,
  withdrawalId: number,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "admin_process_withdrawal_button"),
          callback_data: `withdrawal_admin_process_${withdrawalId}`,
        },
      ],
      [
        {
          text: getText(language, "admin_cancel_withdrawal_button"),
          callback_data: `withdrawal_admin_cancel_${withdrawalId}`,
        },
        {
          text: getText(language, "admin_refund_withdrawal_button"),
          callback_data: `withdrawal_admin_refund_${withdrawalId}`,
        },
      ],
      [
        {
          text: getText(language, "btn_back"),
          callback_data: CALLBACK_DATA.ADMIN_PENDING_WITHDRAWALS,
        },
      ],
    ],
  };
}

export function getAdminBackKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "btn_back"),
          callback_data: CALLBACK_DATA.ADMIN_PANEL,
        },
      ],
    ],
  };
}

export function getAdminPendingWithdrawalsKeyboard(
  language: MaybeOptional<Language>,
  withdrawalIds: number[],
): InlineKeyboardMarkup {
  const rows: { text: string; callback_data: string }[][] = [];

  for (const id of withdrawalIds) {
    rows.push([
      {
        text: `👁 #${id}`,
        callback_data: `withdrawal_admin_view_${id}`,
      },
    ]);
  }

  rows.push([
    {
      text: getText(language, "btn_back"),
      callback_data: CALLBACK_DATA.ADMIN_PANEL,
    },
  ]);

  return { inline_keyboard: rows };
}
