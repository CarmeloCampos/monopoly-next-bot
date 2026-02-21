import type {
  Language,
  TelegramId,
  MonopolyCoins,
  ReferralLevel,
  NonEmptyArray,
  UpgradeErrorCode,
  WithdrawalCurrency,
  WithdrawalStatus,
  WithdrawalId,
  DepositId,
} from "@/types/branded";
import type { PropertyIndex, PropertyLevel } from "@/constants/properties";
import type { ServiceIndex } from "@/constants/services";

export function isTelegramId(value: unknown): value is TelegramId {
  return typeof value === "number" && value > 0 && Number.isInteger(value);
}

export function isMonopolyCoins(value: unknown): value is MonopolyCoins {
  return typeof value === "number" && value >= 0 && Number.isFinite(value);
}

export function isLanguage(value: unknown): value is Language {
  return value === "ru" || value === "en" || value === "es" || value === "pt";
}

export function isReferralLevel(value: unknown): value is ReferralLevel {
  if (typeof value !== "number" || !Number.isInteger(value)) return false;
  return value >= 1 && value <= 5;
}

export function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}

export function isPropertyIndex(value: unknown): value is PropertyIndex {
  if (typeof value !== "number" || !Number.isInteger(value)) return false;
  return value >= 0 && value <= 12;
}

export function isPropertyLevel(value: unknown): value is PropertyLevel {
  if (typeof value !== "number" || !Number.isInteger(value)) return false;
  return value >= 1 && value <= 4;
}

export function isServiceIndex(value: unknown): value is ServiceIndex {
  if (typeof value !== "number" || !Number.isInteger(value)) return false;
  return value >= 0 && value <= 11;
}

export function isUpgradeErrorCode(value: unknown): value is UpgradeErrorCode {
  return (
    typeof value === "string" &&
    (value === "not_found" ||
      value === "insufficient_balance" ||
      value === "cannot_upgrade_free_property" ||
      value === "max_level_reached" ||
      value === "color_requirement_not_met")
  );
}

export function isWithdrawalCurrency(
  value: unknown,
): value is WithdrawalCurrency {
  return (
    typeof value === "string" &&
    (value === "bitcoin" || value === "usdt_tron" || value === "monero")
  );
}

export function isWithdrawalStatus(value: unknown): value is WithdrawalStatus {
  return (
    typeof value === "string" &&
    (value === "pending" ||
      value === "processed" ||
      value === "cancelled" ||
      value === "refunded")
  );
}

export function isWithdrawalId(value: unknown): value is WithdrawalId {
  return typeof value === "number" && value > 0 && Number.isInteger(value);
}

export function isDepositId(value: unknown): value is DepositId {
  return typeof value === "number" && value > 0 && Number.isInteger(value);
}
