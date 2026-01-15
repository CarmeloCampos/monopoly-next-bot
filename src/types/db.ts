/**
 * Centralized database types from Drizzle schema.
 * These types are auto-generated from schema definitions.
 */

import {
  users,
  userProperties,
  userServices,
  referrals,
  referralEarnings,
  transactions,
  diceUnlocks,
  gameStates,
  miniGameLogs,
} from "@/db/schema";

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertUserProperty = typeof userProperties.$inferInsert;
export type SelectUserProperty = typeof userProperties.$inferSelect;

export type InsertUserService = typeof userServices.$inferInsert;
export type SelectUserService = typeof userServices.$inferSelect;

export type InsertReferral = typeof referrals.$inferInsert;
export type SelectReferral = typeof referrals.$inferSelect;

export type InsertReferralEarning = typeof referralEarnings.$inferInsert;
export type SelectReferralEarning = typeof referralEarnings.$inferSelect;

export type InsertTransaction = typeof transactions.$inferInsert;
export type SelectTransaction = typeof transactions.$inferSelect;

export type InsertDiceUnlock = typeof diceUnlocks.$inferInsert;
export type SelectDiceUnlock = typeof diceUnlocks.$inferSelect;

export type InsertGameState = typeof gameStates.$inferInsert;
export type SelectGameState = typeof gameStates.$inferSelect;

export type InsertMiniGameLog = typeof miniGameLogs.$inferInsert;
export type SelectMiniGameLog = typeof miniGameLogs.$inferSelect;

export type DbInsert = {
  users: InsertUser;
  userProperties: InsertUserProperty;
  userServices: InsertUserService;
  referrals: InsertReferral;
  referralEarnings: InsertReferralEarning;
  transactions: InsertTransaction;
  diceUnlocks: InsertDiceUnlock;
  gameStates: InsertGameState;
  miniGameLogs: InsertMiniGameLog;
};

export type DbSelect = {
  users: SelectUser;
  userProperties: SelectUserProperty;
  userServices: SelectUserService;
  referrals: SelectReferral;
  referralEarnings: SelectReferralEarning;
  transactions: SelectTransaction;
  diceUnlocks: SelectDiceUnlock;
  gameStates: SelectGameState;
  miniGameLogs: SelectMiniGameLog;
};
