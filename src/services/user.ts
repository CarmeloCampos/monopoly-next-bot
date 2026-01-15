import { db } from "@/db";
import { userProperties } from "@/db/schema";
import type { TelegramId } from "@/types";
import { asMonopolyCoins } from "@/types/utils";
import { STARTER_PROPERTY_INDEX } from "@/constants/game";
import { info } from "@/utils/logger";

export async function giveStarterProperty(userId: TelegramId): Promise<void> {
  const now = new Date();

  const existing = await db.query.userProperties.findFirst({
    where: (fields, { eq, and }) =>
      and(
        eq(fields.user_id, userId),
        eq(fields.property_index, STARTER_PROPERTY_INDEX),
      ),
  });

  if (existing) return;

  await db.insert(userProperties).values({
    user_id: userId,
    property_index: STARTER_PROPERTY_INDEX,
    level: 1,
    accumulated_unclaimed: asMonopolyCoins(0),
    last_generated_at: now,
    purchased_at: now,
    created_at: now,
    updated_at: now,
  });

  info("Starter property given", { userId });
}
