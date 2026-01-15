import type { Context } from "telegraf";
import type { SelectUser } from "./db";
import type { MonopolyCoins, Language } from "./utils";

interface BotState {}

/**
 * Base BotContext with optional dbUser (before middleware)
 */
interface BotContext extends Context {
  session?: BotState;
  dbUser?: SelectUser;
  isNewUser?: boolean;
  referralBonusReceived?: MonopolyCoins;
}

/**
 * BotContext after auto-user middleware with guaranteed dbUser
 */
interface BotContextWithUser extends BotContext {
  dbUser: SelectUser;
}

/**
 * BotContext with user and confirmed language selection
 */
interface BotContextWithLanguage extends BotContextWithUser {
  dbUser: SelectUser & { language: Language };
}

/**
 * Type guard to check if context has dbUser
 */
function hasDbUser(ctx: BotContext): ctx is BotContextWithUser {
  return ctx.dbUser !== undefined;
}

/**
 * Type guard to check if context has dbUser with language
 */
function hasLanguage(ctx: BotContext): ctx is BotContextWithLanguage {
  return (
    ctx.dbUser !== undefined &&
    ctx.dbUser.language !== null &&
    ctx.dbUser.language !== undefined
  );
}

export type {
  BotState,
  BotContext,
  BotContextWithUser,
  BotContextWithLanguage,
};
export { hasDbUser, hasLanguage };
export * from "./utils";
export * from "./db";
