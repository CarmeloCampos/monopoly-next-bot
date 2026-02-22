/**
 * Admin state management for tracking admin action flows
 */

import type { TelegramId, WithdrawalId } from "@/types";

export interface AdminState {
  step: "process_hash" | "cancel_reason";
  withdrawalId?: WithdrawalId;
}

const adminStates = new Map<TelegramId, AdminState>();

export function setAdminState(userId: TelegramId, state: AdminState): void {
  adminStates.set(userId, state);
}

export function getAdminState(userId: TelegramId): AdminState | undefined {
  return adminStates.get(userId);
}

export function clearAdminState(userId: TelegramId): void {
  adminStates.delete(userId);
}

export function isInAdminFlow(userId: TelegramId): boolean {
  return adminStates.has(userId);
}
