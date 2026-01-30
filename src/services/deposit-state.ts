/**
 * Deposit state management for tracking user deposit flow
 */

import type { TelegramId } from "@/types";
import type { DepositState } from "@/types/deposit";

// In-memory state storage (temporary, per-request only)
const depositStates = new Map<TelegramId, DepositState>();

/**
 * Set deposit state for a user
 */
export function setDepositState(userId: TelegramId, state: DepositState): void {
  depositStates.set(userId, state);
}

/**
 * Get deposit state for a user
 */
export function getDepositState(userId: TelegramId): DepositState | undefined {
  return depositStates.get(userId);
}

/**
 * Clear deposit state for a user
 */
export function clearDepositState(userId: TelegramId): void {
  depositStates.delete(userId);
}

/**
 * Check if user is in deposit flow
 */
export function isInDepositFlow(userId: TelegramId): boolean {
  return depositStates.has(userId);
}
