import {
  type BotContextWithLanguage,
  type Language,
  isPropertyIndex,
  isServiceIndex,
  type MaybeUndefined,
} from "@/types";
import {
  getPropertyByIndex,
  getPropertyCost,
  getPropertyIncome,
  type PropertyIndex,
} from "@/constants/properties";
import { getText } from "@/i18n";
import { getBoardKeyboard } from "@/keyboards";
import { rollDice } from "@/services/dice";
import { getUserGameState, setUnlockedItem } from "@/services/game-state";
import { getServiceByIndex } from "@/constants/services";
import { getPropertyImageUrl, getServiceImageUrl } from "@/utils/property";
import {
  sendPhotoWithFallback,
  sendBackButton,
} from "@/handlers/shared/photo-message";

export async function handleBoard(ctx: BotContextWithLanguage): Promise<void> {
  const { dbUser } = ctx;

  const gameState = await getUserGameState(dbUser.telegram_id);

  if (gameState?.currentUnlockItemType !== undefined) {
    const errorKey =
      gameState.currentUnlockItemType === "property"
        ? "error_cannot_advance_property"
        : "error_cannot_advance_service";

    await ctx.reply(getText(dbUser.language, errorKey), {
      reply_markup: getBoardKeyboard(dbUser.language, true),
    });
    return;
  }

  await ctx.reply(getText(dbUser.language, "board_welcome"), {
    reply_markup: getBoardKeyboard(dbUser.language, false),
  });
}

export async function handleRollDice(
  ctx: BotContextWithLanguage,
): Promise<void> {
  const { dbUser } = ctx;

  const gameState = await getUserGameState(dbUser.telegram_id);
  if (gameState?.currentUnlockItemType) {
    const errorKey =
      gameState.currentUnlockItemType === "property"
        ? "error_cannot_advance_property"
        : "error_cannot_advance_service";
    await ctx.reply(getText(dbUser.language, errorKey));
    return;
  }

  const diceResult = await ctx.sendDice();

  const roll = diceResult.dice?.value ?? 1;

  const result = await rollDice(dbUser.telegram_id);

  if (!result.success) {
    await ctx.reply(getText(dbUser.language, "error_no_items_available"));
    return;
  }

  const { itemType, itemIndex } = result.data;

  await setUnlockedItem(dbUser.telegram_id, itemType, itemIndex);

  if (itemType === "property") {
    await showUnlockedProperty(ctx, itemIndex, roll);
  } else {
    await showUnlockedService(ctx, itemIndex, roll);
  }
}

export async function handleViewCurrent(
  ctx: BotContextWithLanguage,
): Promise<void> {
  const { dbUser } = ctx;

  const gameState = await getUserGameState(dbUser.telegram_id);
  if (!gameState?.currentUnlockItemType) {
    await ctx.reply(getText(dbUser.language, "board_no_item"));
    return;
  }

  const { currentUnlockItemType, currentUnlockItemIndex } = gameState;

  if (currentUnlockItemIndex === undefined) {
    await ctx.reply(getText(dbUser.language, "board_no_item"));
    return;
  }

  if (currentUnlockItemType === "property") {
    await showUnlockedProperty(ctx, currentUnlockItemIndex);
  } else {
    await showUnlockedService(ctx, currentUnlockItemIndex);
  }
}

async function showUnlockedProperty(
  ctx: BotContextWithLanguage,
  itemIndex: number,
  roll?: number,
): Promise<void> {
  const { dbUser } = ctx;

  if (!isPropertyIndex(itemIndex)) {
    await ctx.reply(getText(dbUser.language, "error_property_not_found"));
    return;
  }

  const property = getPropertyByIndex(itemIndex);
  if (!property) {
    await ctx.reply(getText(dbUser.language, "error_property_not_found"));
    return;
  }

  const propertyName = getText(dbUser.language, property.nameKey);
  const colorKey = `color_${property.color}` as const;
  const color = getText(dbUser.language, colorKey);

  const cost1 = getPropertyCost(itemIndex, 1);
  const income1 = getPropertyIncome(itemIndex, 1);

  const message =
    roll !== undefined
      ? getText(dbUser.language, "board_rolled_property_simple")
          .replace("{roll}", String(roll))
          .replace(/{property}/g, propertyName)
          .replace("{color}", color)
          .replace("{cost}", String(cost1 ?? 0))
          .replace("{income}", income1 ? String(income1) : "0")
      : buildFullPropertyMessage(dbUser.language, propertyName, color, {
          itemIndex,
          cost1,
          income1,
        });

  const imageUrl = getPropertyImageUrl(itemIndex, 1);

  await sendPhotoWithFallback(ctx, {
    imageUrl,
    caption: message,
    callbackData: `board_buy_property_${itemIndex}`,
    itemIndex,
    itemType: "property",
  });

  await sendBackButton(ctx);
}

interface PropertyCostIncome {
  itemIndex: PropertyIndex;
  cost1: MaybeUndefined<number>;
  income1: MaybeUndefined<number>;
}

function buildFullPropertyMessage(
  language: Language,
  propertyName: string,
  color: string,
  costs: PropertyCostIncome,
): string {
  const { itemIndex, cost1, income1 } = costs;
  const cost2 = getPropertyCost(itemIndex, 2);
  const cost3 = getPropertyCost(itemIndex, 3);
  const cost4 = getPropertyCost(itemIndex, 4);
  const income2 = getPropertyIncome(itemIndex, 2);
  const income3 = getPropertyIncome(itemIndex, 3);
  const income4 = getPropertyIncome(itemIndex, 4);

  return getText(language, "board_unlocked_property")
    .replace("{property}", propertyName)
    .replace("{color}", color)
    .replace("{cost1}", String(cost1 ?? 0))
    .replace("{cost2}", String(cost2 ?? 0))
    .replace("{cost3}", String(cost3 ?? 0))
    .replace("{cost4}", String(cost4 ?? 0))
    .replace("{income1}", income1 ? String(income1) : "0")
    .replace("{income2}", income2 ? String(income2) : "0")
    .replace("{income3}", income3 ? String(income3) : "0")
    .replace("{income4}", income4 ? String(income4) : "0");
}

async function showUnlockedService(
  ctx: BotContextWithLanguage,
  itemIndex: number,
  roll?: number,
): Promise<void> {
  const { dbUser } = ctx;

  if (!isServiceIndex(itemIndex)) {
    await ctx.reply(getText(dbUser.language, "error_service_not_found"));
    return;
  }

  const service = getServiceByIndex(itemIndex);
  if (!service) {
    await ctx.reply(getText(dbUser.language, "error_service_not_found"));
    return;
  }

  const serviceName = getText(dbUser.language, service.nameKey);
  const boostText = `${service.boostPercentage}%`;

  const messageKey =
    roll !== undefined ? "board_rolled_service" : "board_unlocked_service";
  const message = buildServiceMessage(
    dbUser.language,
    messageKey,
    serviceName,
    service.cost,
    boostText,
    roll,
  );

  const imageUrl = getServiceImageUrl(itemIndex);

  await sendPhotoWithFallback(ctx, {
    imageUrl,
    caption: message,
    callbackData: `board_buy_service_${itemIndex}`,
    itemIndex,
    itemType: "service",
  });

  await sendBackButton(ctx);
}

function buildServiceMessage(
  language: Language,
  messageKey: string,
  serviceName: string,
  cost: number,
  boostText: string,
  roll?: number,
): string {
  let message = getText(language, messageKey)
    .replace("{service}", serviceName)
    .replace("{cost}", String(cost))
    .replace("{boost}", boostText);

  if (roll !== undefined) {
    message = message.replace("{roll}", String(roll));
  }

  return message;
}
