import type { BotContextWithLanguage, UserPropertyData } from "@/types";
import { isPropertyIndex } from "@/types/index";
import { getText } from "@/i18n";
import { getUserProperties } from "@/services/property";
import {
  getPropertyByIndex,
  PROPERTY_COUNT_BY_COLOR,
  type PropertyColor,
} from "@/constants/properties";
import {
  getPropertyImageUrl,
  buildPropertyDetailMessage,
} from "@/utils/property";
import { getPropertyNavigationKeyboard } from "@/keyboards/property";
import { displayMediaCard } from "./media-display";

function calculateColorProgress(
  properties: UserPropertyData[],
  targetColor: PropertyColor,
): { owned: number; minLevel: number } {
  const colorProperties = properties.filter((p) => {
    if (!isPropertyIndex(p.property_index)) return false;
    const info = getPropertyByIndex(p.property_index);
    return info?.color === targetColor;
  });

  if (colorProperties.length === 0) {
    return { owned: 0, minLevel: 0 };
  }

  const minLevel = Math.min(...colorProperties.map((p) => p.level));
  return { owned: colorProperties.length, minLevel };
}

interface SendPropertyCardParams {
  ctx: BotContextWithLanguage;
  propertyIndex: number;
  isNavigation: boolean;
}

export async function sendPropertyCard(
  params: SendPropertyCardParams,
): Promise<void> {
  const { ctx, propertyIndex, isNavigation } = params;
  const { dbUser } = ctx;

  const properties = await getUserProperties(dbUser.telegram_id);

  if (properties.length === 0) {
    if (isNavigation) {
      await ctx.deleteMessage();
      return;
    }

    await ctx.reply(getText(dbUser.language, "property_no_properties"), {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: getText(dbUser.language, "btn_back"),
              callback_data: "property_back",
            },
          ],
        ],
      },
    });
    return;
  }

  if (propertyIndex < 0 || propertyIndex >= properties.length) {
    if (isNavigation) {
      return;
    }
    await ctx.reply(getText(dbUser.language, "error_property_not_found"));
    return;
  }

  const property = properties[propertyIndex];
  if (!property) {
    if (isNavigation) {
      return;
    }
    await ctx.reply(getText(dbUser.language, "error_property_not_found"));
    return;
  }

  if (!isPropertyIndex(property.property_index)) {
    if (isNavigation) {
      return;
    }
    await ctx.reply(getText(dbUser.language, "error_property_not_found"));
    return;
  }

  const validPropertyIndex = property.property_index;
  const propertyInfo = getPropertyByIndex(validPropertyIndex);

  if (!propertyInfo) {
    if (isNavigation) {
      return;
    }
    await ctx.reply(getText(dbUser.language, "error_property_not_found"));
    return;
  }

  const imageUrl = getPropertyImageUrl(property.property_index, property.level);

  // Calculate color progress
  const colorProgress = calculateColorProgress(properties, propertyInfo.color);
  const progressInfo = {
    currentIndex: propertyIndex,
    totalProperties: properties.length,
    colorOwned: colorProgress.owned,
    colorTotal: PROPERTY_COUNT_BY_COLOR[propertyInfo.color],
    colorMinLevel: colorProgress.minLevel,
  };

  const totalAccumulated = properties.reduce(
    (sum, p) => sum + p.accumulated_unclaimed,
    0,
  );

  const detailMessage = buildPropertyDetailMessage(
    property,
    propertyInfo,
    dbUser.language,
    progressInfo,
  );

  const keyboard = getPropertyNavigationKeyboard(
    propertyIndex,
    properties.length,
    validPropertyIndex,
    dbUser.language,
    property,
    colorProgress.owned,
    totalAccumulated,
  );

  await displayMediaCard({
    ctx,
    imageUrl,
    caption: detailMessage,
    keyboard,
    isNavigation,
  });
}
