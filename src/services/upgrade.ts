import { db } from "@/db";
import { userProperties } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { info } from "@/utils/logger";
import { checkAndDeductBalance } from "@/utils/transaction";

import {
  type TelegramId,
  type MonopolyCoins,
  type UpgradeResult,
  type PropertyColor,
  asMonopolyCoins,
} from "@/types";
import {
  getPropertyByIndex,
  getPropertyCost,
  type PropertyLevel,
  type PropertyIndex,
  PROPERTY_COUNT_BY_COLOR,
} from "@/constants/properties";
import { STARTER_PROPERTY_INDEX } from "@/constants/game";
import { isPropertyIndex } from "@/utils/guards";

interface UpgradePropertyParams {
  userId: TelegramId;
  propertyIndex: PropertyIndex;
}

export function getUpgradeCost(
  propertyIndex: PropertyIndex,
  currentLevel: PropertyLevel,
): MonopolyCoins {
  if (currentLevel >= 4) {
    return asMonopolyCoins(0);
  }

  const nextLevel = (currentLevel + 1) as PropertyLevel;
  const cost = getPropertyCost(propertyIndex, nextLevel);
  const currentCost = getPropertyCost(propertyIndex, currentLevel);

  if (cost === undefined || currentCost === undefined) {
    return asMonopolyCoins(0);
  }

  return asMonopolyCoins(cost - currentCost);
}

async function getAllUserPropertiesByColor(
  userId: TelegramId,
  color: PropertyColor,
): Promise<PropertyIndex[]> {
  const allProperties = await db.query.userProperties.findMany({
    where: (fields, { eq }) => eq(fields.user_id, userId),
  });

  const userPropertyIndices = allProperties.map((p) => p.property_index);

  const propertiesOfColor: PropertyIndex[] = [];
  for (const index of userPropertyIndices) {
    if (!isPropertyIndex(index)) continue;
    const property = getPropertyByIndex(index);
    if (property && property.color === color) {
      propertiesOfColor.push(index);
    }
  }

  return propertiesOfColor;
}

interface Level4RequirementResult {
  readonly canUpgrade: boolean;
  readonly owned: number;
  readonly required: number;
  readonly missingCount: number;
  readonly lowLevelCount: number;
}

async function canUpgradeToLevel4(
  userId: TelegramId,
  propertyIndex: PropertyIndex,
): Promise<Level4RequirementResult> {
  const property = getPropertyByIndex(propertyIndex);
  if (!property) {
    return {
      canUpgrade: false,
      owned: 0,
      required: 0,
      missingCount: 0,
      lowLevelCount: 0,
    };
  }

  const { color } = property;
  const requiredCount = PROPERTY_COUNT_BY_COLOR[color];

  const userProperties = await db.query.userProperties.findMany({
    where: (fields, { eq, and }) =>
      and(eq(fields.user_id, userId), eq(fields.property_index, propertyIndex)),
  });

  const [userProperty] = userProperties;
  if (!userProperty || userProperty.level !== 3) {
    return {
      canUpgrade: false,
      owned: 0,
      required: requiredCount,
      missingCount: requiredCount,
      lowLevelCount: 0,
    };
  }

  const colorProperties = await getAllUserPropertiesByColor(userId, color);
  const owned = colorProperties.length;
  const missingCount = requiredCount - owned;

  let lowLevelCount = 0;
  for (const colorPropIndex of colorProperties) {
    const propRecord = await db.query.userProperties.findFirst({
      where: (fields, { eq, and }) =>
        and(
          eq(fields.user_id, userId),
          eq(fields.property_index, colorPropIndex),
        ),
    });

    if (!propRecord || propRecord.level < 3) {
      lowLevelCount++;
    }
  }

  const canUpgrade = owned === requiredCount && lowLevelCount === 0;

  return {
    canUpgrade,
    owned,
    required: requiredCount,
    missingCount,
    lowLevelCount,
  };
}

export async function upgradeProperty(
  params: UpgradePropertyParams,
): Promise<UpgradeResult> {
  const { userId, propertyIndex } = params;

  if (propertyIndex === STARTER_PROPERTY_INDEX) {
    return { success: false, code: "cannot_upgrade_free_property" };
  }

  const userProperty = await db.query.userProperties.findFirst({
    where: (fields, { eq }) =>
      and(eq(fields.user_id, userId), eq(fields.property_index, propertyIndex)),
  });

  if (!userProperty) {
    return { success: false, code: "not_found" };
  }

  if (userProperty.level >= 4) {
    return { success: false, code: "max_level_reached" };
  }

  const nextLevel = (userProperty.level + 1) as PropertyLevel;

  if (nextLevel === 4) {
    const requirementResult = await canUpgradeToLevel4(userId, propertyIndex);
    if (!requirementResult.canUpgrade) {
      const property = getPropertyByIndex(propertyIndex);
      return {
        success: false,
        code: "color_requirement_not_met",
        colorDetails: {
          color: property?.color ?? "unknown",
          owned: requirementResult.owned,
          required: requirementResult.required,
          missingCount: requirementResult.missingCount,
          lowLevelCount: requirementResult.lowLevelCount,
        },
      };
    }
  }

  const upgradeCost = await getUpgradeCost(propertyIndex, userProperty.level);

  if (upgradeCost > 0) {
    const balanceResult = await checkAndDeductBalance(
      userId,
      upgradeCost,
      `Upgrade: Property ${propertyIndex} to level ${nextLevel}`,
    );
    if (!balanceResult.success) {
      return {
        success: false,
        code: "insufficient_balance",
        needed: upgradeCost,
      };
    }
  }

  const now = new Date();
  await db
    .update(userProperties)
    .set({
      level: nextLevel,
      updated_at: now,
    })
    .where(eq(userProperties.id, userProperty.id));

  const property = getPropertyByIndex(propertyIndex);

  info("Property upgraded", {
    userId,
    propertyIndex,
    propertyName: property?.nameKey,
    previousLevel: userProperty.level,
    newLevel: nextLevel,
    cost: upgradeCost,
  });

  return { success: true };
}
