import type { BotContextWithLanguage } from "@/types";
import { isPropertyIndex } from "@/utils/guards";
import { getText } from "@/i18n";
import { getUserProperties } from "@/services/property";
import { getPropertyByIndex } from "@/constants/properties";
import {
  getPropertyImageUrl,
  buildPropertyDetailMessage,
} from "@/utils/property";
import { getPropertyNavigationKeyboard } from "@/keyboards/property";

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

  const propertyName = getText(dbUser.language, propertyInfo.nameKey);
  const imageUrl = getPropertyImageUrl(property.property_index, propertyName);

  const detailMessage = buildPropertyDetailMessage(
    property,
    propertyInfo,
    dbUser.language,
  );

  const keyboard = getPropertyNavigationKeyboard(
    propertyIndex,
    properties.length,
    validPropertyIndex,
    dbUser.language,
  );

  if (isNavigation) {
    if (ctx.callbackQuery?.message && "photo" in ctx.callbackQuery.message) {
      await ctx.editMessageMedia(
        {
          type: "photo",
          media: imageUrl,
          caption: detailMessage,
          parse_mode: "Markdown",
        },
        { reply_markup: keyboard },
      );
    } else {
      await ctx.editMessageText(detailMessage, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    }
  } else {
    await ctx.replyWithPhoto(imageUrl, {
      caption: detailMessage,
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}
