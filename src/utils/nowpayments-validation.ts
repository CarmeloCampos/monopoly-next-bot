/**
 * NOWPayments validation utilities - shared between services and cronjobs
 */

import type { NowPaymentsStatus } from "@/types/nowpayments";

/**
 * Type guard for checking if a value is a valid object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Type guard for checking if a value is a valid string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard for checking if a value is a valid number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Type guard for checking if a value is a valid NowPaymentsStatus
 */
export function isNowPaymentsStatus(
  value: unknown,
): value is NowPaymentsStatus {
  if (!isString(value)) return false;
  const validStatuses = [
    "waiting",
    "confirming",
    "confirmed",
    "sending",
    "partially_paid",
    "finished",
    "failed",
    "refunded",
    "expired",
  ];
  return validStatuses.includes(value);
}
