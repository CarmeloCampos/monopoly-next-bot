import { db } from "@/db";
import { users, referrals, referralEarnings, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type {
  TelegramId,
  ReferralLevel,
  MonopolyCoins,
  Result,
  Language,
} from "@/types";
import {
  asMonopolyCoins,
  success,
  failure,
  isReferralLevel,
} from "@/types/utils";
import { REFERRAL_BONUS_BY_LEVEL, REFERRAL_BONUSES } from "@/constants/game";
import { info } from "@/utils/logger";
import { buildReferralLevelMessage } from "@/i18n";

interface ReferralProcessResult {
  bonusGiven: MonopolyCoins;
  referrersRewarded: number;
}

const LEVEL_ONE: ReferralLevel = 1;
const MAX_REFERRAL_DEPTH = 5;

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
    where: (fields, { eq, and }) =>
      and(eq(fields.referred_id, referredId), eq(fields.level, LEVEL_ONE)),
  });
}

async function getReferralChain(
  userId: TelegramId,
): Promise<{ userId: TelegramId; level: ReferralLevel }[]> {
  const chain: { userId: TelegramId; level: ReferralLevel }[] = [];
  let currentId = userId;

  for (let level = 1; level <= MAX_REFERRAL_DEPTH; level++) {
    const referral = await findReferralByReferredId(currentId);

    if (!referral) break;

    if (isReferralLevel(level)) {
      chain.push({ userId: referral.referrer_id, level });
      currentId = referral.referrer_id;
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
    level: LEVEL_ONE,
    created_at: now,
  });

  await addBalanceAndTransaction(
    newUserId,
    asMonopolyCoins(REFERRAL_BONUSES.INVITED),
    "referral",
    buildReferralLevelMessage(language, 0),
  );

  const chain = await getReferralChain(referrerId);
  chain.unshift({ userId: referrerId, level: LEVEL_ONE });

  for (const { userId, level } of chain) {
    const bonus = REFERRAL_BONUS_BY_LEVEL[level];
    await addBalanceAndTransaction(
      userId,
      asMonopolyCoins(bonus),
      "referral",
      buildReferralLevelMessage(language, level),
    );
    await db.insert(referralEarnings).values({
      user_id: userId,
      referred_user_id: newUserId,
      level,
      amount: asMonopolyCoins(bonus),
      created_at: now,
    });
  }

  info("Referral processed", {
    newUserId,
    referrerId,
    chainLength: chain.length,
  });

  return success({
    bonusGiven: asMonopolyCoins(REFERRAL_BONUSES.INVITED),
    referrersRewarded: chain.length,
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
