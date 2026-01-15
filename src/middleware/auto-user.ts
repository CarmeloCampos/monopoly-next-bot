import type { Middleware } from "telegraf";
import {
  isNonEmptyArray,
  isLanguage,
  type BotContext,
  type InsertUser,
  type SelectUser,
  type TelegramId,
  type Language,
} from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateReferralCode } from "@/utils/referral";
import { asTelegramId, asMonopolyCoins } from "@/types/utils";
import { info } from "@/utils/logger";
import { processReferral } from "@/services/referral";
import { giveStarterProperty } from "@/services/user";
import { DEFAULT_LANGUAGE, CALLBACK_PATTERNS } from "@/constants";

export const autoUserMiddleware: Middleware<BotContext> = async (ctx, next) => {
  const { from } = ctx;
  if (!from) return next();

  const telegramId = asTelegramId(from.id);

  try {
    const user = await findUserByTelegramId(telegramId);
    if (user) {
      ctx.dbUser = user;
      return next();
    }

    const referralCode = extractReferralCode(ctx);
    const newUser = await createUser(from);
    if (!newUser) return next();

    ctx.dbUser = newUser;
    ctx.isNewUser = true;

    await giveStarterProperty(newUser.telegram_id);

    if (!referralCode) return next();

    const referrerLang = await getReferrerLanguage(referralCode);
    const finalLang =
      referrerLang && isLanguage(referrerLang)
        ? referrerLang
        : DEFAULT_LANGUAGE;
    const result = await processReferral(
      newUser.telegram_id,
      referralCode,
      finalLang,
    );
    if (result.success) {
      ctx.referralBonusReceived = result.data.bonusGiven;
    }
  } catch (error) {
    info("Error in auto-user middleware", { telegramId, error });
  }

  return next();
};

function extractReferralCode(ctx: BotContext): string | undefined {
  if (!ctx.message || !("text" in ctx.message)) return undefined;
  const match = ctx.message.text.match(CALLBACK_PATTERNS.START_REFERRAL);
  return match?.[1];
}

async function findUserByTelegramId(
  telegramId: TelegramId,
): Promise<SelectUser | undefined> {
  return await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.telegram_id, telegramId),
  });
}

async function createUser(
  from: NonNullable<BotContext["from"]>,
): Promise<SelectUser | undefined> {
  const now = new Date();

  const newUser: InsertUser = {
    telegram_id: asTelegramId(from.id),
    username: from.username,
    first_name: from.first_name,
    last_name: from.last_name,
    balance: asMonopolyCoins(0),
    referral_code: generateReferralCode(),
    language: null,
    created_at: now,
    updated_at: now,
  };

  const inserted = await db.insert(users).values(newUser).returning();
  if (!isNonEmptyArray(inserted)) return undefined;

  info("New user created", {
    telegramId: from.id,
    referralCode: newUser.referral_code,
  });

  return inserted[0];
}

async function getReferrerLanguage(
  referralCode: string,
): Promise<Language | null | undefined> {
  const referrer = await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.referral_code, referralCode),
    columns: { language: true },
  });
  return referrer?.language;
}
