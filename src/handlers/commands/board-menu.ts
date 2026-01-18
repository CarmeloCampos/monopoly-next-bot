import {
  type BotContextWithLanguage,
  isPropertyIndex,
  isServiceIndex,
} from "@/types";
import { getText } from "@/i18n";
import { getBoardKeyboard } from "@/keyboards";
import { rollDice } from "@/services/dice";
import { getUserGameState, setUnlockedItem } from "@/services/game-state";
import {
  getPropertyByIndex,
  getPropertyCost,
  getPropertyIncome,
} from "@/constants/properties";
import { getServiceByIndex } from "@/constants/services";
import { getPropertyImageUrl, getServiceImageUrl } from "@/utils/property";

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
  const color =
    property.color.charAt(0).toUpperCase() + property.color.slice(1);

  const cost1 = getPropertyCost(itemIndex, 1);
  const cost2 = getPropertyCost(itemIndex, 2);
  const cost3 = getPropertyCost(itemIndex, 3);
  const cost4 = getPropertyCost(itemIndex, 4);

  const income1 = getPropertyIncome(itemIndex, 1);
  const income2 = getPropertyIncome(itemIndex, 2);
  const income3 = getPropertyIncome(itemIndex, 3);
  const income4 = getPropertyIncome(itemIndex, 4);

  const messageKey =
    roll !== undefined ? "board_rolled_property" : "board_unlocked_property";
  let message = getText(dbUser.language, messageKey)
    .replace("{property}", propertyName)
    .replace("{color}", color)
    .replace("{cost1}", String(cost1))
    .replace("{cost2}", String(cost2))
    .replace("{cost3}", String(cost3))
    .replace("{cost4}", String(cost4))
    .replace("{income1}", income1 ? String(income1) : "0")
    .replace("{income2}", income2 ? String(income2) : "0")
    .replace("{income3}", income3 ? String(income3) : "0")
    .replace("{income4}", income4 ? String(income4) : "0");

  if (roll !== undefined) {
    message = message.replace("{roll}", String(roll));
  }

  // Generate property image URL
  const imageUrl = getPropertyImageUrl(itemIndex, propertyName);

  await ctx.replyWithPhoto(imageUrl, {
    caption: message,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: getText(dbUser.language, "btn_buy"),
            callback_data: `board_buy_property_${itemIndex}`,
          },
        ],
      ],
    },
  });
  await ctx.reply(getText(dbUser.language, "btn_back"), {
    reply_markup: getBoardKeyboard(dbUser.language, true),
  });
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
  let message = getText(dbUser.language, messageKey)
    .replace("{service}", serviceName)
    .replace("{cost}", String(service.cost))
    .replace("{boost}", boostText);

  if (roll !== undefined) {
    message = message.replace("{roll}", String(roll));
  }

  const imageUrl = getServiceImageUrl(itemIndex, serviceName);

  await ctx.replyWithPhoto(imageUrl, {
    caption: message,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: getText(dbUser.language, "btn_buy"),
            callback_data: `board_buy_service_${itemIndex}`,
          },
        ],
      ],
    },
  });
  await ctx.reply(getText(dbUser.language, "btn_back"), {
    reply_markup: getBoardKeyboard(dbUser.language, true),
  });
}
