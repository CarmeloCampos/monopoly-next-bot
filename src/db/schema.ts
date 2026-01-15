import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import type { PropertyLevel } from "@/constants/properties";
import type {
  TelegramId,
  MonopolyCoins,
  ReferralLevel,
  Language,
} from "@/types/utils";

// ============================================
// Users Table
// ============================================

export const users = sqliteTable(
  "users",
  {
    telegram_id: integer("telegram_id").primaryKey().$type<TelegramId>(),
    username: text("username"),
    first_name: text("first_name"),
    last_name: text("last_name"),
    balance: integer("balance").notNull().default(0).$type<MonopolyCoins>(),
    referral_code: text("referral_code").notNull().unique(),
    language: text("language").$type<Language>(),
    created_at: integer("created_at", { mode: "timestamp" }).notNull(),
    updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    referralCodeIdx: index("referral_code_idx").on(table.referral_code),
  }),
);

// ============================================
// User Properties Table
// ============================================

export const userProperties = sqliteTable(
  "user_properties",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .$type<TelegramId>(),
    property_index: integer("property_index").notNull(),
    level: integer("level").notNull().$type<PropertyLevel>(),
    accumulated_unclaimed: real("accumulated_unclaimed")
      .notNull()
      .default(0)
      .$type<MonopolyCoins>(),
    last_generated_at: integer("last_generated_at", {
      mode: "timestamp",
    }).notNull(),
    last_claimed_at: integer("last_claimed_at", { mode: "timestamp" }),
    purchased_at: integer("purchased_at", { mode: "timestamp" }).notNull(),
    created_at: integer("created_at", { mode: "timestamp" }).notNull(),
    updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("user_properties_user_id_idx").on(table.user_id),
  }),
);

// ============================================
// User Services Table
// ============================================

export const userServices = sqliteTable(
  "user_services",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .$type<TelegramId>(),
    service_index: integer("service_index").notNull(),
    purchased_at: integer("purchased_at", { mode: "timestamp" }).notNull(),
    created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("user_services_user_id_idx").on(table.user_id),
  }),
);

// ============================================
// Referrals Table
// ============================================

export const referrals = sqliteTable(
  "referrals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    referrer_id: integer("referrer_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .$type<TelegramId>(),
    referred_id: integer("referred_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .$type<TelegramId>(),
    level: integer("level").notNull().$type<ReferralLevel>(),
    created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    referrerIdIdx: index("referrals_referrer_id_idx").on(table.referrer_id),
    referredIdIdx: index("referrals_referred_id_idx").on(table.referred_id),
  }),
);

// ============================================
// Referral Earnings Table
// ============================================

export const referralEarnings = sqliteTable(
  "referral_earnings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .$type<TelegramId>(),
    referred_user_id: integer("referred_user_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .$type<TelegramId>(),
    level: integer("level").notNull().$type<ReferralLevel>(),
    amount: real("amount").notNull().$type<MonopolyCoins>(),
    created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("referral_earnings_user_id_idx").on(table.user_id),
  }),
);

// ============================================
// Transactions Table
// ============================================

export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .$type<TelegramId>(),
    type: text("type").notNull(),
    amount: real("amount").notNull().$type<MonopolyCoins>(),
    description: text("description"),
    metadata: text("metadata", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("transactions_user_id_idx").on(table.user_id),
  }),
);

// ============================================
// Dice Unlocks Table
// ============================================

export const diceUnlocks = sqliteTable(
  "dice_unlocks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .$type<TelegramId>(),
    item_type: text("item_type").notNull(),
    item_index: integer("item_index").notNull(),
    is_purchased: integer("is_purchased", { mode: "boolean" })
      .notNull()
      .default(false),
    unlocked_at: integer("unlocked_at", { mode: "timestamp" }).notNull(),
    created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("dice_unlocks_user_id_idx").on(table.user_id),
  }),
);

// ============================================
// Game States Table
// ============================================

export const gameStates = sqliteTable(
  "game_states",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .unique()
      .$type<TelegramId>(),
    can_roll_dice: integer("can_roll_dice", { mode: "boolean" })
      .notNull()
      .default(true),
    current_unlock_item_type: text("current_unlock_item_type"),
    current_unlock_item_index: integer("current_unlock_item_index"),
    updated_at: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("game_states_user_id_idx").on(table.user_id),
  }),
);

// ============================================
// Mini Game Logs Table
// ============================================

export const miniGameLogs = sqliteTable(
  "mini_game_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.telegram_id, { onDelete: "cascade" })
      .$type<TelegramId>(),
    game_type: text("game_type").notNull(),
    cost: real("cost").notNull().$type<MonopolyCoins>(),
    result: text("result"),
    winnings: real("winnings").notNull().$type<MonopolyCoins>(),
    created_at: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("mini_game_logs_user_id_idx").on(table.user_id),
  }),
);
