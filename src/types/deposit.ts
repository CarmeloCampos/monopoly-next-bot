/**
 * Types for deposit operations
 */

import type { TelegramId } from "./branded";
import type { SelectDeposit } from "./db";

// Re-export SelectDeposit from db.ts for convenience
export type { SelectDeposit };

/**
 * Input for creating a new deposit
 */
export interface CreateDepositInput {
  userId: TelegramId;
  amountUsd: number;
  payCurrency: string;
}

/**
 * Error codes for deposit creation failures
 */
export type DepositErrorCode =
  | "minimum_amount"
  | "invalid_amount"
  | "api_error"
  | "database_error"
  | "crypto_minimum_amount"
  | "crypto_estimate_unavailable";

/**
 * Result of creating a deposit
 */
export interface CreateDepositResult {
  success: boolean;
  error?: DepositErrorCode;
  deposit?: SelectDeposit;
  paymentUrl?: string;
  minimumAmount?: number;
}

/**
 * Deposit state for tracking user flow
 */
export interface DepositState {
  step: DepositStep;
  amountUsd?: number;
  payCurrency?: string;
}

/**
 * Valid steps in the deposit flow
 */
export type DepositStep = "amount" | "security" | "crypto" | "confirm";
