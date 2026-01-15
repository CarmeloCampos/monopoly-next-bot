export const TRANSACTION_TYPES = [
  "purchase",
  "withdrawal",
  "earning",
  "referral",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const ITEM_TYPES = ["property", "service"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const GAME_TYPES = [
  "dice",
  "darts",
  "basketball",
  "football",
  "bowling",
  "slots",
] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const DICE_OUTCOMES = {
  PROPERTY: [5, 6] as const,
  SERVICE: [1, 2, 3, 4] as const,
};

export const MC_PER_USD = 1000;
export const WITHDRAWAL_MIN_MC = 10000;
export const INVESTMENT_MIN_USD = 10;
export const STARTER_PROPERTY_INDEX = 12;
export const STARTER_PROPERTY_HOURLY_INCOME = 1.39; // 1000 MC / 30 días / 24 horas
