import { db } from "@/db";
import { users, referrals, referralEarnings, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  isReferralLevel,
  isLanguage,
  type TelegramId,
  type ReferralLevel,
  type MonopolyCoins,
  type Result,
  type Language,
  type MaybeOptional,
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
): Promise<{ referrer_id: TelegramId } | undefined> {
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
      user?.language && isLanguage(user.language)
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

async function addBalanceAndTransaction(
  userId: TelegramId,
  amount: MonopolyCoins,
  type: "referral" | "earning",
  description: string,
): Promise<void> {
  await db
    .update(users)
    .set({
      balance: sql`balance + ${amount}`,
      updated_at: new Date(),
    })
    .where(eq(users.telegram_id, userId));

  await db.insert(transactions).values({
    user_id: userId,
    type,
    amount,
    description,
    created_at: new Date(),
  });
}
