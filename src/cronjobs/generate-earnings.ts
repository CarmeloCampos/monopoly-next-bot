import { db } from "@/db";
import { userProperties, users } from "@/db/schema";
import { getPropertyByIndex, getPropertyIncome } from "@/constants/properties";
import { eq } from "drizzle-orm";
import { asMonopolyCoins } from "@/types/utils";
import { isPropertyIndex, isPropertyLevel } from "@/utils/guards";
import { calculateTotalBoost } from "@/services/boost";

export async function generateEarningsForAllUsers(): Promise<void> {
  const allUserProperties = await db.select().from(userProperties);

  for (const userProperty of allUserProperties) {
    const {
      property_index: propertyIndex,
      user_id: userId,
      level,
      accumulated_unclaimed: accumulatedUnclaimed,
      id,
    } = userProperty;

    if (!isPropertyIndex(propertyIndex)) continue;

    const propertyData = getPropertyByIndex(propertyIndex);
    if (!propertyData) continue;

    const now = new Date();
    const { last_generated_at: lastGenerated } = userProperty;
    const minutesSinceLastGeneration =
      (now.getTime() - lastGenerated.getTime()) / (1000 * 60);

    if (minutesSinceLastGeneration < 1) continue;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegram_id, userId))
      .limit(1);
    if (!user) continue;

    if (!isPropertyLevel(level)) continue;

    const { color } = propertyData;

    const totalBoost = await calculateTotalBoost(userId, color);
    const hourlyIncome = getPropertyIncome(propertyIndex, level) ?? 0;
    const minuteIncome = (hourlyIncome * totalBoost) / 60;
    const earnings = minuteIncome * minutesSinceLastGeneration;

    await db
      .update(userProperties)
      .set({
        accumulated_unclaimed: asMonopolyCoins(accumulatedUnclaimed + earnings),
        last_generated_at: now,
        updated_at: now,
      })
      .where(eq(userProperties.id, id));
  }
}
