import type { InlineKeyboardMarkup } from "telegraf/types";
import { getText } from "@/i18n";
import type { Language } from "@/types";

export function getServiceNavigationKeyboard(
  currentIndex: number,
  totalServices: number,
  language: Language,
): InlineKeyboardMarkup {
  const keyboard: InlineKeyboardMarkup["inline_keyboard"] = [];

  const navigationRow: InlineKeyboardMarkup["inline_keyboard"][0] = [];

  if (currentIndex > 0) {
    navigationRow.push({
      text: "◀️",
      callback_data: `service_nav_${currentIndex - 1}`,
    });
  }

  if (currentIndex < totalServices - 1) {
    navigationRow.push({
      text: "▶️",
      callback_data: `service_nav_${currentIndex + 1}`,
    });
  }

  if (navigationRow.length > 0) {
    keyboard.push(navigationRow);
  }

  keyboard.push([
    {
      text: getText(language, "btn_close"),
      callback_data: "service_close",
    },
  ]);

  return { inline_keyboard: keyboard };
}
