import type {
  ReplyKeyboardMarkup,
  InlineKeyboardMarkup,
  KeyboardButton,
} from "telegraf/types";
import { getText, getSupportedLanguages, getLanguageName } from "@/i18n";
import type { Language, MaybeOptional } from "@/types";
import { LANGUAGE_EMOJIS, CHANNEL_URLS } from "@/constants";
import { debug } from "@/utils/logger";

export function getMainMenuKeyboard(
  language: MaybeOptional<Language>,
  isAdmin = false,
): ReplyKeyboardMarkup {
  const keyboard: KeyboardButton[][] = [
    [
      { text: getText(language, "menu_properties") },
      { text: getText(language, "menu_board") },
      { text: getText(language, "menu_services") },
    ],
    [
      { text: getText(language, "menu_balance") },
      { text: getText(language, "menu_minigames") },
    ],
    [
      { text: getText(language, "menu_referral") },
      { text: getText(language, "menu_deposit") },
      { text: getText(language, "menu_settings") },
    ],
  ];

  debug("Building main menu keyboard", { isAdmin, language });

  if (isAdmin) {
    keyboard.push([{ text: getText(language, "admin_panel_button") }]);
    debug("Admin button added to keyboard");
  } else {
    debug("Admin button NOT added - user is not admin");
  }

  return {
    keyboard,
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function getBoardKeyboard(
  language: MaybeOptional<Language>,
  hasUnlockedItem: boolean,
): ReplyKeyboardMarkup {
  const buttons: KeyboardButton[][] = [];

  if (hasUnlockedItem) {
    buttons.push([
      { text: getText(language, "board_roll_dice") },
      { text: getText(language, "board_view_current") },
    ]);
  } else {
    buttons.push([{ text: getText(language, "board_roll_dice") }]);
  }

  buttons.push([{ text: getText(language, "btn_back") }]);

  return {
    keyboard: buttons,
    resize_keyboard: true,
    is_persistent: true,
  };
}

export function getLanguageKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: getSupportedLanguages().map((lang) => [
      {
        text: `${LANGUAGE_EMOJIS[lang]} ${getLanguageName(lang)}`,
        callback_data: `lang_${lang}`,
      },
    ]),
  };
}

export function getSettingsKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: getText(language, "settings_language"),
          callback_data: "settings_language",
        },
      ],
      [
        {
          text: getText(language, "settings_support"),
          callback_data: "settings_support",
        },
      ],
      [
        {
          text: getText(language, "settings_channels"),
          callback_data: "settings_channels",
        },
      ],
      [
        {
          text: getText(language, "btn_back"),
          callback_data: "settings_close",
        },
      ],
    ],
  };
}

export function getChannelsKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: `📢 ${getText(language, "channel_official")}`,
          url: CHANNEL_URLS.official,
        },
      ],
      [
        {
          text: `💬 ${getText(language, "channel_community")}`,
          url: CHANNEL_URLS.community,
        },
      ],
      [
        {
          text: `📰 ${getText(language, "channel_news")}`,
          url: CHANNEL_URLS.news,
        },
      ],
      [
        {
          text: getText(language, "btn_back"),
          callback_data: "settings_back",
        },
      ],
    ],
  };
}

type MenuButtonKey =
  | "properties"
  | "board"
  | "services"
  | "balance"
  | "referral"
  | "minigames"
  | "settings";

type MenuButtonTexts = Record<MenuButtonKey, string>;

export function getMenuButtonTexts(
  language: MaybeOptional<Language>,
): MenuButtonTexts {
  return {
    properties: getText(language, "menu_properties"),
    board: getText(language, "menu_board"),
    services: getText(language, "menu_services"),
    balance: getText(language, "menu_balance"),
    referral: getText(language, "menu_referral"),
    minigames: getText(language, "menu_minigames"),
    settings: getText(language, "menu_settings"),
  };
}
