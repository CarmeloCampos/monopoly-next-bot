import type { ReferralLevel } from "@/types";

export const STARTER_PROPERTY_INDEX = 12;

const REFERRAL_BONUS_LEVELS = [100, 75, 50, 25, 10] as const;

export const REFERRAL_BONUS = {
  INVITED: 200,
  LEVELS: REFERRAL_BONUS_LEVELS,
} as const;

/**
 * Get the referral bonus amount for a given referral level.
 * @param level - The referral level (1-5)
 * @returns The bonus amount for that level
 * @throws Error if level is out of bounds
 */
export function getReferralBonusByLevel(level: ReferralLevel): number {
  const index = level - 1;
  const bonus = REFERRAL_BONUS_LEVELS[index];
  if (bonus === undefined) {
    throw new Error(
      `Invalid referral level: ${level}. Must be between 1 and 5.`,
    );
  }
  return bonus;
}
