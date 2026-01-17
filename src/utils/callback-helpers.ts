import type { BotContext, CallbackMatchResult } from "@/types";
import { getText } from "@/i18n";

export async function answerUserNotFound(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery?.(getText("en", "error_user_not_found"));
}

export async function answerInvalidCallback(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery?.(getText("en", "error_invalid_callback"));
}

/**
 * Extracts and validates callback query data against a pattern.
 * Returns null if callback query is invalid or pattern doesn't match.
 *
 * @param ctx - Bot context containing the callback query
 * @param pattern - Regex pattern to match against callback data
 * @returns Match result or null if validation fails
 */
export function extractCallbackMatch(
  ctx: BotContext,
  pattern: RegExp,
): CallbackMatchResult | null {
  const { callbackQuery } = ctx;
  if (!callbackQuery || !("data" in callbackQuery) || !callbackQuery.data) {
    return null;
  }

  const match = callbackQuery.data.match(pattern);
  if (!match) {
    return null;
  }

  return { match, data: callbackQuery.data };
}
