import type {
  TelegramId,
  MaybeUndefined,
  WithdrawalCurrency,
  MonopolyCoins,
} from "@/types";

export interface WithdrawalState {
  step: "currency" | "amount" | "wallet" | "confirm";
  currency?: WithdrawalCurrency;
  amount?: MonopolyCoins;
  walletAddress?: string;
}

/**
 * In-memory storage for active withdrawal sessions.
 *
 * NOTE: This is intentionally in-memory storage for short-lived withdrawal state.
 * Unlike persistent data (users, properties, etc.), withdrawal sessions:
 * - Last only a few minutes during the withdrawal creation flow
 * - Don't need to survive bot restarts
 * - Are cleared after withdrawal completion or cancellation
 *
 * If bot restarts mid-withdrawal, users simply need to start the withdrawal process again.
 */
const activeWithdrawals = new Map<TelegramId, WithdrawalState>();

export function setWithdrawalState(
  userId: TelegramId,
  state: WithdrawalState,
): void {
  activeWithdrawals.set(userId, state);
}

export function getWithdrawalState(
  userId: TelegramId,
): MaybeUndefined<WithdrawalState> {
  return activeWithdrawals.get(userId);
}

export function clearWithdrawalState(userId: TelegramId): void {
  activeWithdrawals.delete(userId);
}

export function updateWithdrawalState(
  userId: TelegramId,
  updates: Partial<WithdrawalState>,
): void {
  const state = activeWithdrawals.get(userId);
  if (state) {
    activeWithdrawals.set(userId, { ...state, ...updates });
  }
}

export function isInWithdrawalFlow(userId: TelegramId): boolean {
  return activeWithdrawals.has(userId);
}
