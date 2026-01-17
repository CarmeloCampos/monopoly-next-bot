/**
 * Utility types and converter functions.
 * Re-exports branded types and adds validation converter functions.
 */

import {
  isTelegramId as validateTelegramId,
  isMonopolyCoins as validateMonopolyCoins,
} from "@/utils/guards";

// Re-export all branded types
export type {
  MaybeOptional,
  TelegramId,
  MonopolyCoins,
  ReferralLevel,
  Language,
  Result,
} from "./branded";

export { MAX_REFERRAL_LEVEL, success, failure } from "./branded";

/**
 * Validates and converts an unknown value to TelegramId.
 * @throws Error if value is not a valid Telegram ID
 */
export function asTelegramId(id: unknown): import("./branded").TelegramId {
  if (!validateTelegramId(id)) {
    throw new Error(`Invalid Telegram ID: ${String(id)}`);
  }
  return id;
}

/**
 * Validates and converts an unknown value to MonopolyCoins.
 * @throws Error if value is not a valid MonopolyCoins amount
 */
export function asMonopolyCoins(
  amount: unknown,
): import("./branded").MonopolyCoins {
  if (!validateMonopolyCoins(amount)) {
    throw new Error(`Invalid MonopolyCoins amount: ${String(amount)}`);
  }
  return amount;
}
