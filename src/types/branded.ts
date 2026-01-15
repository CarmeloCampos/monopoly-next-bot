/**
 * Branded types and utility types that have no external dependencies.
 * This file breaks the circular dependency between types and guards.
 */

/** Utility type for nullable or undefined values */
export type MaybeOptional<T> = T | null | undefined;

/** Non-empty array type */
export type NonEmptyArray<T> = [T, ...T[]];

/** Branded type for Telegram user IDs */
export type TelegramId = number & { readonly __brand: unique symbol };

/** Branded type for in-game currency */
export type MonopolyCoins = number & { readonly __brand: unique symbol };

/** Valid referral levels (1-5) */
export type ReferralLevel = 1 | 2 | 3 | 4 | 5;

/** Maximum referral level constant */
export const MAX_REFERRAL_LEVEL: ReferralLevel = 5;

/** Supported language codes */
export type Language = "ru" | "en" | "es" | "pt";

/** Discriminated union for success result */
export interface Success<T> {
  success: true;
  data: T;
}

/** Discriminated union for failure result */
export interface Failure<E = string> {
  success: false;
  error: E;
}

/** Result type for operations that can succeed or fail */
export type Result<T, E = string> = Success<T> | Failure<E>;

/** Create a success result */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/** Create a failure result */
export function failure<E = string>(error: E): Failure<E> {
  return { success: false, error };
}
