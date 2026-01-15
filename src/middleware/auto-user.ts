import type { Middleware } from "telegraf";
import type {
  BotContext,
  InsertUser,
  SelectUser,
  TelegramId,
  Language,
} from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateReferralCode } from "@/utils/referral";
import {
  asTelegramId,
  asMonopolyCoins,
  isNonEmptyArray,
  type MaybeOptional,
} from "@/types/utils";
import { info } from "@/utils/logger";
import { processReferral } from "@/services/referral";
import { giveStarterProperty } from "@/services/user";
import { isLanguage } from "@/i18n";
import { DEFAULT_LANGUAGE, REFERRAL_CODE_REGEX } from "@/constants";

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

    let referralCode: string | undefined;
    if (ctx.message && "text" in ctx.message) {
      const match = ctx.message.text.match(REFERRAL_CODE_REGEX);
      if (match) {
        const [, code] = match;
        referralCode = code;
      }
    }

    const newUser = await createUser(from);
    if (!newUser) return next();

    ctx.dbUser = newUser;
    ctx.isNewUser = true;

    await giveStarterProperty(newUser.telegram_id);

    if (referralCode) {
      const referrerLang = await getReferrerLanguage(referralCode);
      const finalLang = isLanguage(referrerLang)
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
    }
  } catch (error) {
    info("Error in auto-user middleware", { telegramId, error });
  }

  return next();
};

async function findUserByTelegramId(
  telegramId: TelegramId,
): Promise<MaybeOptional<SelectUser>> {
  const user = await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.telegram_id, telegramId),
  });
  return user;
}

async function createUser(
  from: NonNullable<BotContext["from"]>,
): Promise<MaybeOptional<SelectUser>> {
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
): Promise<MaybeOptional<Language | null>> {
  const referrer = await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.referral_code, referralCode),
    columns: { language: true },
  });
  return referrer?.language;
}
