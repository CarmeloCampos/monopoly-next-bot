import type { Telegram } from "telegraf";
import { error } from "@/utils/logger";

interface ExtraOptions {
  [key: string]: unknown;
}

export async function sendMarkdownSafe(
  telegram: Telegram,
  chatId: number,
  text: string,
  extra?: ExtraOptions,
): Promise<void> {
  try {
    await telegram.sendMessage(chatId, text, {
      ...extra,
      parse_mode: "Markdown",
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorMessageLower = errorMessage.toLowerCase();

    // Detect parse entity errors with multiple variants
    const isParseError =
      errorMessageLower.includes("can't parse entities") ||
      errorMessageLower.includes("cantparseentities") ||
      errorMessageLower.includes("parse entities") ||
      (errorMessageLower.includes("bad request") &&
        errorMessageLower.includes("entity"));

    if (isParseError) {
      error("Markdown parse error, retrying as plain text", {
        chatId,
        error: errorMessage,
        text: text.slice(0, 100),
      });

      try {
        await telegram.sendMessage(chatId, text, extra);
      } catch (retryError) {
        const retryErrorMessage =
          retryError instanceof Error ? retryError.message : String(retryError);
        error("Failed to send message even as plain text", {
          chatId,
          error: retryErrorMessage,
        });
      }
    } else {
      error("Failed to send Markdown message", {
        chatId,
        error: errorMessage,
      });
      throw err;
    }
  }
}
