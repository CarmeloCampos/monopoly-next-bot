import type {
  Language,
  TelegramId,
  MonopolyCoins,
  ReferralLevel,
  NonEmptyArray,
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
