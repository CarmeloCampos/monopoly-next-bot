/**
 * Boost calculation services for property earnings.
 * Calculates total boost multipliers based on services and color completion.
 */
import { db } from "@/db";
import { userProperties, userServices } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { TelegramId } from "@/types";
import { isPropertyIndex, isServiceIndex } from "@/utils/guards";
import {
  type PropertyColor,
  COLOR_COMPLETION_BOOSTS,
  PROPERTY_COUNT_BY_COLOR,
  getPropertyByIndex,
} from "@/constants/properties";
import { getServiceByIndex, getTrainBoost } from "@/constants/services";

/**
 * Calculates the total earnings boost multiplier for a property.
 * Combines service boosts and color completion bonuses.
 */
export async function calculateTotalBoost(
  userId: TelegramId,
  color: PropertyColor,
): Promise<number> {
  const servicesBoost = await calculateServicesBoost(userId);
  const colorCompletionBoost = await calculateColorCompletionBoost(
    userId,
    color,
  );

  return (1 + servicesBoost) * (1 + colorCompletionBoost);
}

/**
 * Calculates the total boost from owned services.
 * Trains provide progressive boost based on count owned.
 */
async function calculateServicesBoost(userId: TelegramId): Promise<number> {
  const userServicesList = await db
    .select()
    .from(userServices)
    .where(eq(userServices.user_id, userId));

  let totalBoost = 0;
  let trainCount = 0;

  for (const userService of userServicesList) {
    if (!isServiceIndex(userService.service_index)) continue;

    const service = getServiceByIndex(userService.service_index);
    if (!service) continue;

    if (service.type === "train") {
      trainCount++;
    } else {
      totalBoost += service.boostPercentage / 100;
    }
  }

  totalBoost += getTrainBoost(trainCount) / 100;

  return totalBoost;
}

/**
 * Calculates the color completion boost for a property.
 * Returns bonus percentage when user owns all properties of a color at level 3+.
 */
async function calculateColorCompletionBoost(
  userId: TelegramId,
  color: PropertyColor,
): Promise<number> {
  const userPropertiesList = await db
    .select()
    .from(userProperties)
    .where(eq(userProperties.user_id, userId));

  const colorProperties = userPropertiesList.filter(
    ({ property_index: propertyIndex }) => {
      if (!isPropertyIndex(propertyIndex)) return false;
      const prop = getPropertyByIndex(propertyIndex);
      return prop?.color === color;
    },
  );

  const requiredCount = PROPERTY_COUNT_BY_COLOR[color];

  if (colorProperties.length < requiredCount) {
    return 0;
  }

  const allLevel3 = colorProperties.every((up) => up.level >= 3);
  const allLevel4 = colorProperties.every((up) => up.level >= 4);

  if (allLevel4) {
    return COLOR_COMPLETION_BOOSTS[color].level4;
  } else if (allLevel3) {
    return COLOR_COMPLETION_BOOSTS[color].level3;
  }

  return 0;
}
