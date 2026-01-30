/**
 * Centralized database types from Drizzle schema.
 * These types are auto-generated from schema definitions.
 */

import { users, withdrawals, deposits } from "@/db/schema";
import type {
  MonopolyCoins,
  ReferralLevel,
  WithdrawalId,
  DepositId,
} from "./branded";

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

export type InsertDeposit = typeof deposits.$inferInsert;

// Interface to extend Drizzle's inferred type with branded DepositId
interface DepositExtension {
  id: DepositId;
}

// Composed type using named interface extension pattern
export type SelectDeposit = typeof deposits.$inferSelect & DepositExtension;

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
