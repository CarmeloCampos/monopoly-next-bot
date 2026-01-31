import type { InlineKeyboardMarkup } from "telegraf/types";
import { getText } from "@/i18n";
import { type Language, type UserPropertyData, isPropertyIndex } from "@/types";
import { getUpgradeCost } from "@/services/upgrade";
import { STARTER_PROPERTY_INDEX } from "@/constants/game";
import { getPropertyByIndex } from "@/constants/properties";

export function getPropertyNavigationKeyboard(
  currentIndex: number,
  totalProperties: number,
  propertyIndex: number,
  language: Language,
  propertyData: UserPropertyData,
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

  // Add button to view properties of same color
  if (isPropertyIndex(propertyIndex)) {
    const propertyInfo = getPropertyByIndex(propertyIndex);
    if (propertyInfo) {
      const colorName = getText(language, `color_${propertyInfo.color}`);
      keyboard.push([
        {
          text: getText(language, "property_view_same_color").replace(
            "{color}",
            colorName,
          ),
          callback_data: `property_color_${propertyInfo.color}`,
        },
      ]);
    }
  }

  if (propertyIndex !== STARTER_PROPERTY_INDEX && propertyData.level < 4) {
    if (!isPropertyIndex(propertyIndex)) {
      return { inline_keyboard: keyboard };
    }

    const upgradeCost = getUpgradeCost(
      propertyIndex,
      propertyData.level as 1 | 2 | 3,
    );
    const nextLevel = propertyData.level + 1;
    const upgradeText = getText(language, "property_upgrade_button")
      .replace("{level}", String(nextLevel))
      .replace("{cost}", String(upgradeCost));

    keyboard.push([
      {
        text: upgradeText,
        callback_data: `property_upgrade_${propertyIndex}`,
      },
    ]);
  }

  keyboard.push([
    {
      text: "❌",
      callback_data: "property_close",
    },
  ]);

  return { inline_keyboard: keyboard };
}
