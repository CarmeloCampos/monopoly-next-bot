import { db } from "@/db";
import { gameStates } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { TelegramId, MaybeNull } from "@/types";

type ItemType = "property" | "service";

function isItemType(value: unknown): value is ItemType {
  return value === "property" || value === "service";
}

export async function getUserGameState(userId: TelegramId): Promise<
  MaybeNull<{
    canRollDice: boolean;
    currentUnlockItemType?: "property" | "service";
    currentUnlockItemIndex?: number;
  }>
> {
  const state = await db.query.gameStates.findFirst({
    where: (fields, { eq }) => eq(fields.user_id, userId),
    columns: {
      can_roll_dice: true,
      current_unlock_item_type: true,
      current_unlock_item_index: true,
    },
  });

  if (!state) {
    return null;
  }

  return {
    canRollDice: state.can_roll_dice,
    currentUnlockItemType: isItemType(state.current_unlock_item_type)
      ? state.current_unlock_item_type
      : undefined,
    currentUnlockItemIndex: state.current_unlock_item_index ?? undefined,
  };
}

export async function setUnlockedItem(
  userId: TelegramId,
  itemType: "property" | "service",
  itemIndex: number,
): Promise<void> {
  const now = new Date();
  const existingState = await db.query.gameStates.findFirst({
    where: (fields, { eq }) => eq(fields.user_id, userId),
  });

  if (existingState) {
    await db
      .update(gameStates)
      .set({
        can_roll_dice: false,
        current_unlock_item_type: itemType,
        current_unlock_item_index: itemIndex,
        updated_at: now,
      })
      .where(eq(gameStates.user_id, userId));
  } else {
    await db.insert(gameStates).values({
      user_id: userId,
      can_roll_dice: false,
      current_unlock_item_type: itemType,
      current_unlock_item_index: itemIndex,
      updated_at: now,
    });
  }
}

export async function clearUnlockedItem(userId: TelegramId): Promise<void> {
  const now = new Date();
  await db
    .update(gameStates)
    .set({
      can_roll_dice: true,
      current_unlock_item_type: null,
      current_unlock_item_index: null,
      updated_at: now,
    })
    .where(eq(gameStates.user_id, userId));
}
