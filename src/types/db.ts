/**
 * Centralized database types from Drizzle schema.
 * These types are auto-generated from schema definitions.
 */

import { users } from "@/db/schema";
import type { MonopolyCoins, ReferralLevel } from "./branded";

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

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
