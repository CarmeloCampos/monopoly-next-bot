import type { InlineKeyboardMarkup } from "telegraf/types";
import type { Language, MaybeOptional } from "@/types";
import { getText } from "@/i18n";

export interface PaginationButtonConfig {
  prevText: string;
  nextText: string;
  currentPageText: string;
  prevData: string;
  nextData: string;
  currentPageData: string;
  backButton?: {
    text: string;
    callbackData: string;
  };
}

export interface PaginationOptions {
  currentPage: number;
  hasMore: boolean;
  backButton?: {
    text: string;
    callbackData: string;
  };
}

const DEFAULT_PAGINATION_CONFIG: PaginationButtonConfig = {
  prevText: "◀️",
  nextText: "▶️",
  currentPageText: "{page}",
  prevData: "{prefix}_{page}",
  nextData: "{prefix}_{page}",
  currentPageData: "noop",
};

/**
 * Creates pagination navigation buttons.
 * Returns empty array if pagination is not needed (only one page).
 */
export function createPaginationButtons(
  options: PaginationOptions,
  config: Partial<PaginationButtonConfig> = {},
): { text: string; callback_data: string }[][] {
  const { currentPage, hasMore, backButton } = options;
  const mergedConfig = { ...DEFAULT_PAGINATION_CONFIG, ...config };
  const buttons: { text: string; callback_data: string }[] = [];

  if (currentPage > 1) {
    buttons.push({
      text: mergedConfig.prevText,
      callback_data: mergedConfig.prevData.replace(
        "{page}",
        String(currentPage - 1),
      ),
    });
  }

  buttons.push({
    text: mergedConfig.currentPageText.replace("{page}", String(currentPage)),
    callback_data: mergedConfig.currentPageData,
  });

  if (hasMore) {
    buttons.push({
      text: mergedConfig.nextText,
      callback_data: mergedConfig.nextData.replace(
        "{page}",
        String(currentPage + 1),
      ),
    });
  }

  const result: { text: string; callback_data: string }[][] = [];

  if (buttons.length > 1) {
    result.push(buttons);
  }

  if (backButton) {
    result.push([
      {
        text: backButton.text,
        callback_data: backButton.callbackData,
      },
    ]);
  }

  return result;
}

/**
 * Creates a standard pagination keyboard with back button.
 */
export function getPaginationKeyboard(
  language: MaybeOptional<Language>,
  options: PaginationOptions,
  prefix: string,
  backCallbackData: string,
): InlineKeyboardMarkup {
  const buttons = createPaginationButtons(options, {
    prevData: `${prefix}_{page}`,
    nextData: `${prefix}_{page}`,
    backButton: {
      text: getText(language, "btn_back"),
      callbackData: backCallbackData,
    },
  });

  return {
    inline_keyboard: buttons,
  };
}
