/**
 * Centralized database types from Drizzle schema.
 * These types are auto-generated from schema definitions.
 */

import { users, withdrawals } from "@/db/schema";
import type { MonopolyCoins, ReferralLevel, WithdrawalId } from "./branded";

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertWithdrawal = typeof withdrawals.$inferInsert;

// Interface to extend Drizzle's inferred type with branded WithdrawalId
interface WithdrawalExtension {
  id: WithdrawalId;
}

// Composed type using named interface extension pattern
export type SelectWithdrawal = typeof withdrawals.$inferSelect &
  WithdrawalExtension;

/**
 * Referral statistics for a user.
 */
export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: MonopolyCoins;
  referralsByLevel: Record<ReferralLevel, number>;
}

/**
 * Single record of referral earnings.
 */
export interface ReferralEarningRecord {
  amount: MonopolyCoins;
  level: ReferralLevel;
  createdAt: Date;
}
