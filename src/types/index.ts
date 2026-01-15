import type { Context } from "telegraf";
import type { SelectUser } from "./db";
import type { MonopolyCoins, Language, MaybeOptional } from "./utils";

/**
 * SelectUser with language guaranteed to be non-null.
 * Used for contexts where user has already selected a language.
 */
interface SelectUserWithLanguage extends SelectUser {
  language: Language;
}

interface BotContext extends Context {
  dbUser: MaybeOptional<SelectUser>;
  isNewUser?: boolean;
  referralBonusReceived?: MonopolyCoins;
}

interface BotContextWithUser extends BotContext {
  dbUser: SelectUser;
}

interface BotContextWithLanguage extends BotContextWithUser {
  dbUser: SelectUserWithLanguage;
}

function hasDbUser(ctx: BotContext): ctx is BotContextWithUser {
  return ctx.dbUser !== null && ctx.dbUser !== undefined;
}

function hasLanguage(ctx: BotContext): ctx is BotContextWithLanguage {
  if (!hasDbUser(ctx)) return false;
  return ctx.dbUser.language !== null && ctx.dbUser.language !== undefined;
}

export type {
  BotContext,
  BotContextWithUser,
  BotContextWithLanguage,
  SelectUserWithLanguage,
};
export { hasDbUser, hasLanguage };
export * from "./utils";
export * from "./db";
export * from "@/utils/guards";
