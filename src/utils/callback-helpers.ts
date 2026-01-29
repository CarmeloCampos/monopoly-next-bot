import type {
  BotContext,
  BotContextWithLanguage,
  CallbackMatchResult,
  MaybeNull,
  BuyResult,
  WithdrawalId,
} from "@/types";
import { isWithdrawalId } from "@/utils/guards";
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
): MaybeNull<CallbackMatchResult> {
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

/** Extract error from BuyResult for error handling */
type BuyFailureResult = Extract<BuyResult, { success: false }>;

interface HandleBuyErrorParams {
  ctx: BotContextWithLanguage;
  result: BuyFailureResult;
  alreadyOwnedKey: string;
  notFoundKey: string;
}

/**
 * Handles buy result errors uniformly for properties and services.
 * Answers callback query with appropriate error message.
 */
export async function handleBuyError(
  params: HandleBuyErrorParams,
): Promise<void> {
  const { ctx, result, alreadyOwnedKey, notFoundKey } = params;
  const { language } = ctx.dbUser;

  if (result.code === "already_owned") {
    await ctx.answerCbQuery(getText(language, alreadyOwnedKey));
  } else if (result.code === "insufficient_balance" && result.needed) {
    const msg = getText(language, "error_insufficient_balance").replace(
      "{needed}",
      String(result.needed),
    );
    await ctx.answerCbQuery(msg);
  } else {
    await ctx.answerCbQuery(getText(language, notFoundKey));
  }
}

/**
 * Type guard function type for validating indices.
 */
export type IndexValidator<T> = (value: unknown) => value is T;

/**
 * Extracts and validates an index from callback data.
 * Returns null if extraction or validation fails.
 *
 * @param ctx - Bot context containing the callback query
 * @param pattern - Regex pattern to match against callback data
 * @param validator - Type guard function to validate the extracted index
 * @returns Validated index or null if extraction/validation fails
 */
export function extractValidatedIndex<T>(
  ctx: BotContext,
  pattern: RegExp,
  validator: IndexValidator<T>,
): MaybeNull<T> {
  const matchResult = extractCallbackMatch(ctx, pattern);
  if (!matchResult) {
    return null;
  }

  const [, indexStr] = matchResult.match;
  if (!indexStr) {
    return null;
  }

  const index = Number.parseInt(indexStr, 10);
  if (!validator(index)) {
    return null;
  }

  return index;
}

/**
 * Extracts and validates a withdrawal ID from callback data.
 * Returns null if extraction or validation fails.
 *
 * @param ctx - Bot context containing the callback query
 * @param pattern - Regex pattern to match against callback data (should capture withdrawal ID)
 * @returns Validated WithdrawalId or null if extraction/validation fails
 */
export function extractWithdrawalId(
  ctx: BotContext,
  pattern: RegExp,
): MaybeNull<WithdrawalId> {
  const matchResult = extractCallbackMatch(ctx, pattern);
  if (!matchResult) {
    return null;
  }

  const [, idStr] = matchResult.match;
  if (!idStr) {
    return null;
  }

  const id = Number.parseInt(idStr, 10);
  if (!isWithdrawalId(id)) {
    return null;
  }

  return id;
}

/**
 * Extracts and validates a page number from callback data for pagination.
 * Returns null if extraction or validation fails.
 *
 * @param ctx - Bot context containing the callback query
 * @param pattern - Regex pattern to match against callback data (should capture page number)
 * @returns Validated page number (minimum 1) or null if extraction/validation fails
 */
export function extractPageNumber(
  ctx: BotContext,
  pattern: RegExp,
): MaybeNull<number> {
  const matchResult = extractCallbackMatch(ctx, pattern);
  if (!matchResult) {
    return null;
  }

  const [, pageStr] = matchResult.match;
  if (!pageStr) {
    return null;
  }

  const page = Number.parseInt(pageStr, 10);
  if (Number.isNaN(page) || page < 1) {
    return null;
  }

  return page;
}
