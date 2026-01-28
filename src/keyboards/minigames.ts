import type { InlineKeyboardMarkup } from "telegraf/types";
import type { Language, MaybeOptional } from "@/types";
import { getText } from "@/i18n";

export function getMinigamesKeyboard(
  language: MaybeOptional<Language>,
): InlineKeyboardMarkup {
  const gameTypes = [
    "dice",
    "darts",
    "basketball",
    "football",
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
