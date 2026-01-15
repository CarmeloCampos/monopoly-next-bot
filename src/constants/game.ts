import type { ReferralLevel } from "@/types";

export const STARTER_PROPERTY_INDEX = 12;

export const REFERRAL_BONUS = {
  INVITED: 200,
  LEVELS: [100, 75, 50, 25, 10] as const,
} as const;

type ReferralBonusIndex = 0 | 1 | 2 | 3 | 4;

/**
 * Get the referral bonus amount for a given referral level.
 * @param level - The referral level (1-5)
 * @returns The bonus amount for that level
 */
export function getReferralBonusByLevel(level: ReferralLevel): number {
  const index = (level - 1) as ReferralBonusIndex;
  return REFERRAL_BONUS.LEVELS[index];
}
