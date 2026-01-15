/**
 * Utility types for Monopoly Bot project
 */

export type MaybeOptional<T> = T | null | undefined;

export type NonEmptyArray<T> = [T, ...T[]];

export type TelegramId = number & { readonly __brand: unique symbol };

export type MonopolyCoins = number & { readonly __brand: unique symbol };

export type ReferralLevel = 1 | 2 | 3 | 4 | 5;

export type Language = "ru" | "en" | "es" | "pt";

export interface Success<T> {
  success: true;
  data: T;
}

export interface Failure<E = string> {
  success: false;
  error: E;
}

export type Result<T, E = string> = Success<T> | Failure<E>;

export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

export function failure<E = string>(error: E): Failure<E> {
  return { success: false, error };
}

export function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}

export function isReferralLevel(value: number): value is ReferralLevel {
  return value >= 1 && value <= 5 && Number.isInteger(value);
}

export function asTelegramId(id: number): TelegramId {
  return id as TelegramId;
}

export function asMonopolyCoins(amount: number): MonopolyCoins {
  return amount as MonopolyCoins;
}
