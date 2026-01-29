import { db } from "@/db";
import { referrals, referralEarnings } from "@/db/schema";
import {
  isReferralLevel,
  isLanguage,
  type TelegramId,
  type ReferralLevel,
  type MonopolyCoins,
  type Result,
  type Language,
  type MaybeOptional,
  type MaybeUndefined,
  type ReferralStats,
  type ReferralEarningRecord,
} from "@/types";
import {
  asMonopolyCoins,
  success,
  failure,
  MAX_REFERRAL_LEVEL,
} from "@/types/utils";
import { REFERRAL_BONUS, getReferralBonusByLevel } from "@/constants/game";
import { DEFAULT_LANGUAGE } from "@/constants";
import { info } from "@/utils/logger";
import { buildReferralLevelMessage } from "@/i18n";
import { addBalanceAndTransaction } from "@/utils/transaction";
import { count, sum, eq, desc } from "drizzle-orm";

/** Represents a single referrer in the chain who received a bonus */
interface ReferrerReward {
  userId: TelegramId;
  level: ReferralLevel;
  bonus: MonopolyCoins;
  language: MaybeOptional<Language>;
}

interface ReferralProcessResult {
  bonusGiven: MonopolyCoins;
  referrersRewarded: number;
  referrers: ReferrerReward[];
}

const LEVEL_ONE: ReferralLevel = 1;

async function findUserByReferralCode(
  code: string,
): Promise<Result<TelegramId>> {
  const user = await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.referral_code, code),
  });

  if (!user) return failure("Código de referido no encontrado");
  return success(user.telegram_id);
}

async function findReferralByReferredId(
  referredId: TelegramId,
): Promise<MaybeUndefined<{ referrer_id: TelegramId }>> {
  return await db.query.referrals.findFirst({
    where: (fields, { eq }) => eq(fields.referred_id, referredId),
  });
}

async function getReferralChain(
  userId: TelegramId,
): Promise<{ userId: TelegramId; level: ReferralLevel }[]> {
  const chain: { userId: TelegramId; level: ReferralLevel }[] = [];
  let currentId = userId;
  let level = LEVEL_ONE;

  while (level <= MAX_REFERRAL_LEVEL) {
    const referral = await findReferralByReferredId(currentId);
    if (!referral) break;

    if (isReferralLevel(level)) {
      chain.push({ userId: referral.referrer_id, level });
      currentId = referral.referrer_id;
      level++;
    }
  }

  return chain;
}

export async function processReferral(
  newUserId: TelegramId,
  referralCode: string,
  language: Language,
): Promise<Result<ReferralProcessResult>> {
  const referrerResult = await findUserByReferralCode(referralCode);
  if (!referrerResult.success) return referrerResult;

  const referrerId = referrerResult.data;
  const now = new Date();

  await db.insert(referrals).values({
    referrer_id: referrerId,
    referred_id: newUserId,
    created_at: now,
  });

  await addBalanceAndTransaction(
    newUserId,
    asMonopolyCoins(REFERRAL_BONUS.INVITED),
    "referral",
    buildReferralLevelMessage(language, 0),
  );

  const chain = await getReferralChain(newUserId);

  const referrers: ReferrerReward[] = [];

  for (const { userId, level } of chain) {
    const user = await db.query.users.findFirst({
      where: (fields, { eq }) => eq(fields.telegram_id, userId),
      columns: { language: true },
    });
    const referrerLanguage: Language =
      user !== null &&
      user !== undefined &&
      user.language !== null &&
      user.language !== undefined &&
      isLanguage(user.language)
        ? user.language
        : DEFAULT_LANGUAGE;

    const bonus = getReferralBonusByLevel(level);
    await addBalanceAndTransaction(
      userId,
      asMonopolyCoins(bonus),
      "referral",
      buildReferralLevelMessage(referrerLanguage, level),
    );
    await db.insert(referralEarnings).values({
      user_id: userId,
      referred_user_id: newUserId,
      level,
      amount: asMonopolyCoins(bonus),
      created_at: now,
    });

    referrers.push({
      userId,
      level,
      bonus: asMonopolyCoins(bonus),
      language: user?.language ?? null,
    });
  }

  info("Referral processed", {
    newUserId,
    referrerId,
    chainLength: chain.length,
  });

  return success({
    bonusGiven: asMonopolyCoins(REFERRAL_BONUS.INVITED),
    referrersRewarded: chain.length,
    referrers,
  });
}

async function getTotalReferrals(userId: TelegramId): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(referrals)
    .where(eq(referrals.referrer_id, userId));
  return result[0]?.count ?? 0;
}

async function getTotalEarnings(userId: TelegramId): Promise<MonopolyCoins> {
  const result = await db
    .select({ total: sum(referralEarnings.amount) })
    .from(referralEarnings)
    .where(eq(referralEarnings.user_id, userId));
  return asMonopolyCoins(result[0]?.total ?? 0);
}

async function getReferralCountByLevel(
  userId: TelegramId,
): Promise<Record<ReferralLevel, number>> {
  const byLevel = await db
    .select({
      level: referralEarnings.level,
      count: count(),
    })
    .from(referralEarnings)
    .where(eq(referralEarnings.user_id, userId))
    .groupBy(referralEarnings.level);

  const result: Record<ReferralLevel, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const row of byLevel) {
    if (isReferralLevel(row.level)) {
      result[row.level] = row.count;
    }
  }

  return result;
}

export async function getReferralStats(
  userId: TelegramId,
): Promise<ReferralStats> {
  const [totalReferrals, totalEarnings, referralsByLevel] = await Promise.all([
    getTotalReferrals(userId),
    getTotalEarnings(userId),
    getReferralCountByLevel(userId),
  ]);

  return {
    totalReferrals,
    totalEarnings,
    referralsByLevel,
  };
}

export async function getEarningsHistory(
  userId: TelegramId,
  limit: number = 10,
): Promise<ReferralEarningRecord[]> {
  const records = await db
    .select({
      amount: referralEarnings.amount,
      level: referralEarnings.level,
      createdAt: referralEarnings.created_at,
    })
    .from(referralEarnings)
    .where(eq(referralEarnings.user_id, userId))
    .orderBy(desc(referralEarnings.created_at))
    .limit(limit);

  return records.map((r) => {
    if (!isReferralLevel(r.level)) {
      throw new Error(`Invalid referral level: ${r.level}`);
    }
    return {
      amount: r.amount,
      level: r.level,
      createdAt: r.createdAt,
    };
  });
}
