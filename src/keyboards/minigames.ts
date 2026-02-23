import type { InlineKeyboardMarkup } from "telegraf/types";
import type { Language, MaybeOptional } from "@/types";
import { getText } from "@/i18n";
import { BET_ADJUSTMENTS, BET_MULTIPLIERS } from "@/constants/minigames";

/**
 * Generates the minigame selection keyboard
 * @param language - User language for button text
 * @returns Inline keyboard markup with all available minigames
 */
export function getMinigamesKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  const gameTypes = [
    "dice",
    "darts",
    "basketball",
    "bowling",
    "slots",
  ] as const;

  const inlineKeyboard = gameTypes.map((type) => {
    const name = getText(language, `minigame_${type}` as const);

    return [
      {
        text: name,
        callback_data: `minigame_${type}`,
      },
    ];
  });

  inlineKeyboard.push([
    {
      text: getText(language, "btn_back"),
      callback_data: "minigame_cancel",
    },
  ]);

  return {
    inline_keyboard: inlineKeyboard,
  };
}

/**
 * Generates the dice number selection keyboard
 * @param language - User language for button text
 * @returns Inline keyboard markup with numbers 1-6 and back button
 */
export function getDicePickKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  const buttons = [];
  for (let i = 1; i <= 6; i++) {
    buttons.push({
      text: `${i}`,
      callback_data: `dice_pick_${i}`,
    });
  }

  return {
    inline_keyboard: [
      buttons.slice(0, 3),
      buttons.slice(3, 6),
      [
        {
          text: getText(language, "btn_back"),
          callback_data: "minigame_cancel",
        },
      ],
    ],
  };
}

/**
 * Generates the quick play keyboard with bet adjustment buttons
 * @param language - User language for button text
 * @param currentBet - Current bet amount to display
 * @returns Inline keyboard markup with bet adjustment and action buttons
 */
export function getQuickPlayKeyboard(
  language: MaybeOptional<Language>,
  currentBet: number,
): InlineKeyboardMarkup {
  const adjustButtons = BET_ADJUSTMENTS.map((adjustment) => {
    const newBet = currentBet + adjustment;
    const displayValue = adjustment > 0 ? `+${adjustment}` : `${adjustment}`;
    return {
      text: newBet < 1 ? `${adjustment}` : displayValue,
      callback_data: `bet_adjust_${adjustment}`,
    };
  });

  const multiplierButtons = BET_MULTIPLIERS.map((mult) => {
    let label: string;
    let callbackData: string;
    if (mult === 0.5) {
      label = "÷2";
      callbackData = "bet_multiply_0.5";
    } else {
      label = `×${mult}`;
      callbackData = `bet_multiply_${mult}`;
    }
    return {
      text: label,
      callback_data: callbackData,
    };
  });

  return {
    inline_keyboard: [
      adjustButtons,
      multiplierButtons,
      [
        {
          text: getText(language, "minigame_current_bet").replace(
            "{amount}",
            String(currentBet),
          ),
          callback_data: "bet_adjust_0",
        },
      ],
      [
        {
          text: getText(language, "minigame_change_game"),
          callback_data: "minigame_cancel",
        },
        {
          text: getText(language, "minigame_exit"),
          callback_data: "minigame_exit",
        },
      ],
    ],
  };
}
