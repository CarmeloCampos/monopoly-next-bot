import type { Middleware } from "telegraf";
import {
  isNonEmptyArray,
  isLanguage,
  type BotContext,
  type InsertUser,
  type SelectUser,
  type TelegramId,
  type Language,
  type MaybeOptional,
  type MaybeUndefined,
} from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateReferralCode } from "@/utils/referral";
import { asTelegramId, asMonopolyCoins } from "@/types/utils";
import { info } from "@/utils/logger";
import { processReferral } from "@/services/referral";
import { DEFAULT_LANGUAGE, CALLBACK_PATTERNS } from "@/constants";
import { sendReferralNotification } from "@/utils/notifications";
import { eq } from "drizzle-orm";

function detectLanguageFromTelegram(
  languageCode: MaybeUndefined<string>,
): Language {
  if (!languageCode) {
    return DEFAULT_LANGUAGE;
  }

  const lang = languageCode as string;
  const parts = lang.toLowerCase().split(/[-_]/);
  const normalizedLang = parts[0] ?? "";

  if (isLanguage(normalizedLang)) {
    return normalizedLang;
  }

  const langMap: Record<string, Language> = {
    ru: "ru",
    en: "en",
    es: "es",
    pt: "pt",
  };

  const mapped = langMap[normalizedLang];
  return mapped ?? DEFAULT_LANGUAGE;
}

export const autoUserMiddleware: Middleware<BotContext> = async (ctx, next) => {
  const { from } = ctx;
  if (!from) return next();

  const telegramId = asTelegramId(from.id);

  try {
    const user = await findUserByTelegramId(telegramId);
    if (user) {
      ctx.dbUser = user;

      if (!user.language) {
        const detectedLang = detectLanguageFromTelegram(from.language_code);
        await db
          .update(users)
          .set({ language: detectedLang, updated_at: new Date() })
          .where(eq(users.telegram_id, telegramId));
        ctx.dbUser.language = detectedLang;
        info("Language backfilled for existing user", {
          telegramId,
          language: detectedLang,
        });
      }

      return next();
    }

    const referralCode = extractReferralCode(ctx);
    const detectedLang = detectLanguageFromTelegram(from.language_code);
    const newUser = await createUser(from, detectedLang);
    if (!newUser) return next();

    ctx.dbUser = newUser;
    ctx.isNewUser = true;

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
      for (const referrer of result.data.referrers) {
        await sendReferralNotification(
          ctx.telegram,
          referrer.userId,
          referrer.bonus,
          referrer.level,
          referrer.language,
        );
      }
    }
  } catch (error) {
    info("Error in auto-user middleware", { telegramId, error });
  }

  return next();
};

function extractReferralCode(ctx: BotContext): MaybeOptional<string> {
  if (!ctx.message || !("text" in ctx.message)) return undefined;
  const match = ctx.message.text.match(CALLBACK_PATTERNS.START_REFERRAL);
  return match?.[1];
}

async function findUserByTelegramId(
  telegramId: TelegramId,
): Promise<MaybeOptional<SelectUser>> {
  return await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.telegram_id, telegramId),
  });
}

async function createUser(
  from: NonNullable<BotContext["from"]>,
  language: Language,
): Promise<MaybeOptional<SelectUser>> {
  const now = new Date();

  const newUser: InsertUser = {
    telegram_id: asTelegramId(from.id),
    username: from.username,
    first_name: from.first_name,
    last_name: from.last_name,
    balance: asMonopolyCoins(0),
    referral_code: generateReferralCode(),
    language,
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
): Promise<MaybeOptional<Language>> {
  const referrer = await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.referral_code, referralCode),
    columns: { language: true },
  });
  return referrer?.language;
}
