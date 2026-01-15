import type { Middleware } from "telegraf";
import type {
  BotContext,
  InsertUser,
  SelectUser,
  MaybeUndefined,
} from "@/types";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateReferralCode } from "@/utils/referral";
import { asTelegramId, asMonopolyCoins } from "@/types/utils";
import { info } from "@/utils/logger";

export const autoUserMiddleware: Middleware<BotContext> = async (ctx, next) => {
  const { from } = ctx;

  if (!from) return next();

  const telegramId = from.id;

  try {
    const user = await findUserByTelegramId(telegramId);
    if (user) {
      ctx.dbUser = user;
      return next();
    }

    const newUser = await createUser(from);
    if (!newUser) return next();

    ctx.dbUser = newUser;
  } catch (error) {
    info("Error in auto-user middleware", { telegramId, error });
  }

  return next();
};

async function findUserByTelegramId(
  telegramId: number,
): Promise<MaybeUndefined<SelectUser>> {
  const user = await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.telegram_id, asTelegramId(telegramId)),
  });
  return user;
}

async function createUser(
  from: NonNullable<BotContext["from"]>,
): Promise<MaybeUndefined<SelectUser>> {
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
  if (!inserted[0]) return undefined;

  info("New user created", {
    telegramId: from.id,
    referralCode: newUser.referral_code,
  });

  return inserted[0];
}
