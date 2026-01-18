import { db } from "@/db";
import { users, userProperties, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { info } from "@/utils/logger";
import { checkAndDeductBalance } from "@/utils/transaction";

import {
  type TelegramId,
  type MonopolyCoins,
  type MaybeNull,
  type BuyResult,
  asMonopolyCoins,
  type UserPropertyData,
  isPropertyIndex,
  isPropertyLevel,
  type BotContextWithLanguage,
} from "@/types";
import {
  getPropertyByIndex,
  getPropertyIncome,
  type PropertyLevel,
  type PropertyIndex,
} from "@/constants/properties";
import { getText } from "@/i18n";

interface BuyPropertyParams {
  userId: TelegramId;
  propertyIndex: PropertyIndex;
  level: PropertyLevel;
  cost: MonopolyCoins;
}

export async function buyProperty(
  params: BuyPropertyParams,
): Promise<BuyResult> {
  const { userId, propertyIndex, level, cost } = params;

  const property = getPropertyByIndex(propertyIndex);
  if (!property) {
    return { success: false, code: "not_found" };
  }

  if (await userHasProperty(userId, propertyIndex)) {
    return { success: false, code: "already_owned" };
  }

  if (cost > 0) {
    const balanceResult = await checkAndDeductBalance(
      userId,
      cost,
      `Purchase: ${property.nameKey}`,
    );
    if (!balanceResult.success) {
      return { success: false, code: "insufficient_balance", needed: cost };
    }
  }

  const now = new Date();
  await db.insert(userProperties).values({
    user_id: userId,
    property_index: propertyIndex,
    level,
    accumulated_unclaimed: asMonopolyCoins(0),
    last_generated_at: now,
    purchased_at: now,
    created_at: now,
    updated_at: now,
  });

  info("Property purchased", {
    userId,
    propertyIndex,
    propertyName: property.nameKey,
    cost,
    level,
  });

  return { success: true };
}

export async function userHasProperty(
  userId: TelegramId,
  propertyIndex: PropertyIndex,
): Promise<boolean> {
  const existing = await db.query.userProperties.findFirst({
    where: (fields, { eq, and }) =>
      and(eq(fields.user_id, userId), eq(fields.property_index, propertyIndex)),
  });

  return existing !== undefined;
}

function isValidUserPropertyData(data: unknown): data is UserPropertyData {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    "property_index" in obj &&
    "level" in obj &&
    "accumulated_unclaimed" in obj &&
    "last_generated_at" in obj &&
    typeof obj["property_index"] === "number" &&
    typeof obj["level"] === "number" &&
    typeof obj["accumulated_unclaimed"] === "number" &&
    obj["last_generated_at"] instanceof Date
  );
}

export async function getUserProperties(
  userId: TelegramId,
): Promise<UserPropertyData[]> {
  const properties = await db.query.userProperties.findMany({
    where: (fields, { eq }) => eq(fields.user_id, userId),
    columns: {
      property_index: true,
      level: true,
      accumulated_unclaimed: true,
      last_generated_at: true,
    },
    orderBy: (fields, { asc }) => asc(fields.property_index),
  });

  if (properties.every(isValidUserPropertyData)) {
    return properties;
  }

  throw new Error("Invalid user property data returned from database");
}

function calculatePropertyEarnings(property: UserPropertyData): MonopolyCoins {
  // Validate property_index and level before using with getPropertyIncome
  if (
    !isPropertyIndex(property.property_index) ||
    !isPropertyLevel(property.level)
  ) {
    return asMonopolyCoins(0);
  }

  const income = getPropertyIncome(property.property_index, property.level);

  if (!income) return asMonopolyCoins(0);

  const now = new Date();
  const diffHours =
    (now.getTime() - property.last_generated_at.getTime()) / (1000 * 60 * 60);
  const newEarnings = income * diffHours;

  return asMonopolyCoins(property.accumulated_unclaimed + newEarnings);
}

interface ClaimPropertyParams {
  userId: TelegramId;
  propertyIndex: PropertyIndex;
  ctx: BotContextWithLanguage;
}

export async function claimPropertyEarnings(
  params: ClaimPropertyParams,
): Promise<MaybeNull<MonopolyCoins>> {
  const { userId, propertyIndex, ctx } = params;
  const { language } = ctx.dbUser;

  const property = await db.query.userProperties.findFirst({
    where: (fields, { eq, and }) =>
      and(eq(fields.user_id, userId), eq(fields.property_index, propertyIndex)),
  });

  if (!property) {
    await ctx.reply(getText(language, "error_property_not_found"));
    return null;
  }

  const totalEarnings = await calculatePropertyEarnings(property);

  if (totalEarnings <= 0) {
    await ctx.reply(getText(language, "error_no_earnings_to_claim"));
    return null;
  }

  const now = new Date();

  await db
    .update(userProperties)
    .set({
      accumulated_unclaimed: asMonopolyCoins(0),
      last_generated_at: now,
      last_claimed_at: now,
      updated_at: now,
    })
    .where(eq(userProperties.id, property.id));

  await db
    .update(users)
    .set({
      balance: sql`balance + ${totalEarnings}`,
      updated_at: now,
    })
    .where(eq(users.telegram_id, userId));

  await db.insert(transactions).values({
    user_id: userId,
    type: "earning",
    amount: totalEarnings,
    description: `Claim: Property ${propertyIndex}`,
    created_at: now,
  });

  info("Property earnings claimed", {
    userId,
    propertyIndex,
    amount: totalEarnings,
  });

  return totalEarnings;
}
