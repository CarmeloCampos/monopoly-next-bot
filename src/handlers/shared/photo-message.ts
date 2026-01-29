import type { BotContextWithLanguage } from "@/types";
import { getText } from "@/i18n";
import { getBoardKeyboard } from "@/keyboards";
import { debug, error } from "@/utils/logger";

interface PhotoMessageConfig {
  imageUrl: string;
  caption: string;
  callbackData: string;
  itemIndex: number;
  itemType: "property" | "service";
}

/**
 * Sends a photo message with a fallback to text if the photo fails to send.
 * Used for displaying property and service cards in the board menu.
 *
 * @param ctx - The bot context with language
 * @param config - Configuration for the photo message
 * @returns Promise that resolves when the message is sent
 */
export async function sendPhotoWithFallback(
  ctx: BotContextWithLanguage,
  config: PhotoMessageConfig,
): Promise<void> {
  const { imageUrl, caption, callbackData, itemIndex, itemType } = config;
  const { dbUser } = ctx;

  debug(`Sending ${itemType} image`, {
    imageUrl,
    itemIndex,
    userId: dbUser.telegram_id,
  });

  try {
    await ctx.replyWithPhoto(imageUrl, {
      caption,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: getText(dbUser.language, "btn_buy"),
              callback_data: callbackData,
            },
          ],
        ],
      },
    });
    debug(`${itemType} image sent successfully`, {
      itemIndex,
      userId: dbUser.telegram_id,
    });
  } catch (err) {
    error(`Failed to send ${itemType} image`, {
      imageUrl,
      itemIndex,
      userId: dbUser.telegram_id,
      error: err,
    });
    await ctx.reply(caption, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: getText(dbUser.language, "btn_buy"),
              callback_data: callbackData,
            },
          ],
        ],
      },
    });
  }
}

/**
 * Sends the back button message after displaying a property or service.
 *
 * @param ctx - The bot context with language
 * @returns Promise that resolves when the message is sent
 */
export async function sendBackButton(
  ctx: BotContextWithLanguage,
): Promise<void> {
  const { dbUser } = ctx;
  await ctx.reply(getText(dbUser.language, "btn_back"), {
    reply_markup: getBoardKeyboard(dbUser.language, true),
  });
}
