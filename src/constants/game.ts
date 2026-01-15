import type { ReferralLevel } from "@/types";

export const STARTER_PROPERTY_INDEX = 12;

export const REFERRAL_BONUSES = {
  INVITED: 200,
  LEVEL_1: 100,
  LEVEL_2: 75,
  LEVEL_3: 50,
  LEVEL_4: 25,
  LEVEL_5: 10,
} as const;

export const REFERRAL_BONUS_BY_LEVEL: Record<ReferralLevel, number> = {
  1: REFERRAL_BONUSES.LEVEL_1,
  2: REFERRAL_BONUSES.LEVEL_2,
  3: REFERRAL_BONUSES.LEVEL_3,
  4: REFERRAL_BONUSES.LEVEL_4,
  5: REFERRAL_BONUSES.LEVEL_5,
};
