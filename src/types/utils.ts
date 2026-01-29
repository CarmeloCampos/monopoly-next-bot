/**
 * Utility types and converter functions.
 * Re-exports branded types and adds validation converter functions.
 */

import { isTelegramId, isMonopolyCoins, isWithdrawalId } from "@/utils/guards";

// Re-export all branded types
export type {
  MaybeNull,
  MaybeUndefined,
  MaybeOptional,
  MaybeVoid,
  TelegramId,
  MonopolyCoins,
  ReferralLevel,
  Language,
  Result,
  BuyErrorCode,
  BuyResult,
  UpgradeErrorCode,
  UpgradeResult,
  UpgradeFailure,
  WithdrawalCurrency,
  WithdrawalStatus,
  WithdrawalId,
} from "./branded";

export { MAX_REFERRAL_LEVEL, success, failure } from "./branded";

/**
 * Validates and converts an unknown value to TelegramId.
 * @throws Error if value is not a valid Telegram ID
 */
export function asTelegramId(id: unknown): import("./branded").TelegramId {
  if (!isTelegramId(id)) {
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
  if (!isMonopolyCoins(amount)) {
    throw new Error(`Invalid MonopolyCoins amount: ${String(amount)}`);
  }
  return amount;
}

/**
 * Validates and converts an unknown value to WithdrawalId.
 * @throws Error if value is not a valid Withdrawal ID
 */
export function asWithdrawalId(id: unknown): import("./branded").WithdrawalId {
  if (!isWithdrawalId(id)) {
    throw new Error(`Invalid Withdrawal ID: ${String(id)}`);
  }
  return id;
}
