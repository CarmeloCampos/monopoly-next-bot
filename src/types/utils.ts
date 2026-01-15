/**
 * Utility types for the Monopoly Bot project
 */

// ============================================
// Nullability Utilities
// ============================================

/** Value that can be null */
export type MaybeNull<T> = T | null;

/** Value that can be undefined */
export type MaybeUndefined<T> = T | undefined;

/** Value that can be null or undefined */
export type MaybeOptional<T> = T | null | undefined;

/** Remove null from a type */
export type NonNull<T> = Exclude<T, null>;

/** Remove undefined from a type */
export type NonUndefined<T> = Exclude<T, undefined>;

/** Remove null and undefined from a type */
export type NonNullable<T> = Exclude<T, null | undefined>;

// ============================================
// Object Utilities
// ============================================

/** Make all properties optional */
export type Optional<T> = { [K in keyof T]?: T[K] };

/** Make all properties required */
export type Required<T> = { [K in keyof T]-?: T[K] };

/** Make specific properties optional */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Make specific properties required */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/** Make all properties readonly */
export type Immutable<T> = { readonly [K in keyof T]: T[K] };

/** Make all properties mutable (remove readonly) */
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** Deep readonly */
export type DeepImmutable<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepImmutable<T[K]> : T[K];
};

/** Get keys of T that have values of type V */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/** Omit properties with specific value types */
export type OmitByType<T, V> = Pick<
  T,
  { [K in keyof T]: T[K] extends V ? never : K }[keyof T]
>;

/** Pick properties with specific value types */
export type PickByType<T, V> = Pick<T, KeysOfType<T, V>>;

// ============================================
// Array Utilities
// ============================================

/** Get the element type of an array */
export type ArrayElement<T extends readonly unknown[]> = T[number];

/** Ensure a value is an array */
export type Arrayable<T> = T | T[];

/** Non-empty array */
export type NonEmptyArray<T> = [T, ...T[]];

// ============================================
// Function Utilities
// ============================================

/** Async function return type */
export type AsyncReturnType<
  T extends (...args: unknown[]) => Promise<unknown>,
> = T extends (...args: unknown[]) => Promise<infer R> ? R : never;

/** Function that returns a promise */
export type AsyncFunction<
  TArgs extends unknown[] = unknown[],
  TReturn = unknown,
> = (...args: TArgs) => Promise<TReturn>;

// ============================================
// String Utilities
// ============================================

/** Non-empty string */
export type NonEmptyString = string & { readonly __brand: unique symbol };

/** Branded type for type-safe IDs */
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

// ============================================
// Numeric Utilities
// ============================================

/** Positive number brand */
export type PositiveNumber = Brand<number, "PositiveNumber">;

/** Non-negative number (0 or positive) */
export type NonNegativeNumber = Brand<number, "NonNegativeNumber">;

/** Integer brand */
export type Integer = Brand<number, "Integer">;

/** Percentage (0-100) */
export type Percentage = Brand<number, "Percentage">;

// ============================================
// Domain-Specific Types
// ============================================

/** Telegram User ID (always positive integer) */
export type TelegramId = Brand<number, "TelegramId">;

/** MonopolyCoins amount */
export type MonopolyCoins = Brand<number, "MonopolyCoins">;

/** Property Index (0-12) */
export type PropertyIndex = Brand<number, "PropertyIndex">;

/** Service Index (0-11) */
export type ServiceIndex = Brand<number, "ServiceIndex">;

/** Referral Level (1-5) */
export type ReferralLevel = 1 | 2 | 3 | 4 | 5;

/** Supported languages */
export type Language = "ru" | "en" | "es" | "pt";

// ============================================
// Result Types (for error handling)
// ============================================

/** Success result */
export interface Success<T> {
  success: true;
  data: T;
}

/** Error result */
export interface Failure<E = string> {
  success: false;
  error: E;
}

/** Result type for operations that can fail */
export type Result<T, E = string> = Success<T> | Failure<E>;

/** Create a success result */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/** Create a failure result */
export function failure<E = string>(error: E): Failure<E> {
  return { success: false, error };
}

/** Check if result is success */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success;
}

/** Check if result is failure */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.success;
}

// ============================================
// Type Guards
// ============================================

/** Check if value is not null or undefined */
export function isDefined<T>(value: MaybeOptional<T>): value is T {
  return value !== null && value !== undefined;
}

/** Check if value is null */
export function isNull<T>(value: MaybeNull<T>): value is null {
  return value === null;
}

/** Check if value is undefined */
export function isUndefined<T>(value: MaybeUndefined<T>): value is undefined {
  return value === undefined;
}

/** Check if array is non-empty */
export function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}

/** Check if string is non-empty */
export function isNonEmptyString(value: string): value is string {
  return value.length > 0;
}

/** Check if number is positive */
export function isPositive(value: number): value is PositiveNumber {
  return value > 0;
}

/** Check if number is non-negative */
export function isNonNegative(value: number): value is NonNegativeNumber {
  return value >= 0;
}

/** Check if number is integer */
export function isInteger(value: number): value is Integer {
  return Number.isInteger(value);
}

// ============================================
// Branded Type Constructors
// ============================================

/**
 * Create a TelegramId from a number.
 * Use this to convert raw numbers to TelegramId type.
 */
export function asTelegramId(id: number): TelegramId {
  return id as TelegramId;
}

/**
 * Create MonopolyCoins from a number.
 * Use this to convert raw numbers to MonopolyCoins type.
 */
export function asMonopolyCoins(amount: number): MonopolyCoins {
  return amount as MonopolyCoins;
}

/**
 * Create a PropertyIndex from a number.
 * Use this to convert raw numbers to PropertyIndex type.
 */
export function asPropertyIndex(index: number): PropertyIndex {
  return index as PropertyIndex;
}

/**
 * Create a ServiceIndex from a number.
 * Use this to convert raw numbers to ServiceIndex type.
 */
export function asServiceIndex(index: number): ServiceIndex {
  return index as ServiceIndex;
}
