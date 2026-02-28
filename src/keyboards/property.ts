import type { InlineKeyboardMarkup } from "telegraf/types";
import { getText } from "@/i18n";
import {
  type Language,
  type UserPropertyData,
  isPropertyIndex,
  isPropertyLevel,
} from "@/types";
import { getUpgradeCost } from "@/services/upgrade";
import { STARTER_PROPERTY_INDEX } from "@/constants/game";
import { getPropertyByIndex } from "@/constants/properties";

export function getPropertyNavigationKeyboard(
  currentIndex: number,
  totalProperties: number,
  propertyIndex: number,
  language: Language,
  propertyData: UserPropertyData,
  colorPropertyCount = 1,
  totalAccumulated = 0,
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

  if (totalProperties > 1 && totalAccumulated > 0) {
    const claimAllText = getText(language, "property_claim_all_button").replace(
      "{amount}",
      totalAccumulated.toFixed(2),
    );
    keyboard.push([
      {
        text: claimAllText,
        callback_data: `property_claim_all_${currentIndex}`,
      },
    ]);
  }

  // Add button to view properties of same color only if user has more than 1 property of this color
  if (isPropertyIndex(propertyIndex) && colorPropertyCount > 1) {
    const propertyInfo = getPropertyByIndex(propertyIndex);
    if (propertyInfo) {
      const colorName = getText(language, `color_${propertyInfo.color}`);
      keyboard.push([
        {
          text: getText(language, "property_view_same_color").replace(
            "{color}",
            colorName,
          ),
          callback_data: `property_color_${propertyInfo.color}_${currentIndex}`,
        },
      ]);
    }
  }

  if (
    propertyIndex !== STARTER_PROPERTY_INDEX &&
    isPropertyLevel(propertyData.level) &&
    propertyData.level < 4
  ) {
    if (!isPropertyIndex(propertyIndex)) {
      return { inline_keyboard: keyboard };
    }

    const upgradeCost = getUpgradeCost(propertyIndex, propertyData.level);
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
      text: getText(language, "btn_close"),
      callback_data: "property_close",
    },
  ]);

  return { inline_keyboard: keyboard };
}
