import type { BotContextWithLanguage } from "@/types";
import type { InlineKeyboardMarkup } from "telegraf/types";

interface MediaDisplayParams {
  ctx: BotContextWithLanguage;
  imageUrl: string;
  caption: string;
  keyboard: InlineKeyboardMarkup;
  isNavigation: boolean;
}

/**
 * Displays media (photo) in a chat, handling both new messages and navigation updates.
 * When navigating, attempts to edit existing media; falls back to delete-and-resend if needed.
 */
export async function displayMediaCard(
  params: MediaDisplayParams,
): Promise<void> {
  const { ctx, imageUrl, caption, keyboard, isNavigation } = params;

  if (isNavigation) {
    const message = ctx.callbackQuery?.message;
    const hasPhoto = message && "photo" in message;

    if (hasPhoto) {
      await ctx.editMessageMedia(
        {
          type: "photo",
          media: imageUrl,
          caption,
          parse_mode: "Markdown",
        },
        { reply_markup: keyboard },
      );
    } else {
      // If the message doesn't have a photo, delete it and send a new one
      await ctx.deleteMessage();
      await ctx.replyWithPhoto(imageUrl, {
        caption,
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    }
  } else {
    await ctx.replyWithPhoto(imageUrl, {
      caption,
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}
