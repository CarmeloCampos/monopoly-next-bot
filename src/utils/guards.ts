import type {
  Language,
  TelegramId,
  MonopolyCoins,
  ReferralLevel,
  NonEmptyArray,
} from "@/types/branded";

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
