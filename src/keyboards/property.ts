import type { InlineKeyboardMarkup } from "telegraf/types";
import { getText } from "@/i18n";
import type { Language } from "@/types";

export function getPropertyNavigationKeyboard(
  currentIndex: number,
  totalProperties: number,
  propertyIndex: number,
  language: Language,
): InlineKeyboardMarkup {
  const keyboard: InlineKeyboardMarkup["inline_keyboard"] = [];

  const navigationRow: InlineKeyboardMarkup["inline_keyboard"][0] = [];

  if (currentIndex > 0) {
    navigationRow.push({
      text: "◀️",
      callback_data: `property_nav_${currentIndex - 1}`,
    });
  }

  if (currentIndex < totalProperties - 1) {
    navigationRow.push({
      text: "▶️",
      callback_data: `property_nav_${currentIndex + 1}`,
    });
  }

  if (navigationRow.length > 0) {
    keyboard.push(navigationRow);
  }

  keyboard.push([
    {
      text: getText(language, "property_claim_button"),
      callback_data: `property_claim_${propertyIndex}`,
    },
  ]);

  keyboard.push([
    {
      text: "❌",
      callback_data: "property_close",
    },
  ]);

  return { inline_keyboard: keyboard };
}
