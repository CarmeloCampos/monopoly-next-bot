import { Telegraf } from "telegraf";
import {
  type BotContext,
  hasDbUser,
  hasLanguage,
  isPropertyIndex,
  isServiceIndex,
  asMonopolyCoins,
} from "@/types";
import { getText } from "@/i18n";
import { getBoardKeyboard } from "@/keyboards";
import {
  answerInvalidCallback,
  extractCallbackMatch,
  handleBuyError,
} from "@/utils/callback-helpers";
import { CALLBACK_PATTERNS } from "@/constants";
import { buyProperty } from "@/services/property";
import { DEFAULT_PROPERTY_LEVEL } from "@/constants/game";
import { getUserGameState, clearUnlockedItem } from "@/services/game-state";
import { getPropertyCost } from "@/constants/properties";
import { getServiceByIndex } from "@/constants/services";
import { buyService } from "@/services/service";

export function registerBoardCallbacks(bot: Telegraf<BotContext>): void {
  bot.action(CALLBACK_PATTERNS.BOARD_BUY_PROPERTY, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) return;

    const matchResult = extractCallbackMatch(
      ctx,
      CALLBACK_PATTERNS.BOARD_BUY_PROPERTY,
    );
    if (!matchResult) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, propertyIndexStr] = matchResult.match;
    if (!propertyIndexStr) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const propertyIndex = Number.parseInt(propertyIndexStr, 10);
    if (!isPropertyIndex(propertyIndex)) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const gameState = await getUserGameState(ctx.dbUser.telegram_id);
    if (
      gameState?.currentUnlockItemType !== "property" ||
      gameState.currentUnlockItemIndex !== propertyIndex
    ) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const cost = getPropertyCost(propertyIndex, DEFAULT_PROPERTY_LEVEL);
    if (cost === undefined) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_property_not_found"),
      );
      return;
    }

    const buyResult = await buyProperty({
      userId: ctx.dbUser.telegram_id,
      propertyIndex,
      level: DEFAULT_PROPERTY_LEVEL,
      cost: asMonopolyCoins(cost),
    });

    if (!buyResult.success) {
      await handleBuyError({
        ctx,
        result: buyResult,
        alreadyOwnedKey: "error_property_already_owned",
        notFoundKey: "error_property_not_found",
      });
      return;
    }

    await clearUnlockedItem(ctx.dbUser.telegram_id);
    await ctx.answerCbQuery(getText(ctx.dbUser.language, "board_purchased"));
    await ctx.deleteMessage();
    await ctx.reply(getText(ctx.dbUser.language, "board_purchased"), {
      reply_markup: getBoardKeyboard(ctx.dbUser.language, false),
    });
  });

  bot.action(CALLBACK_PATTERNS.BOARD_BUY_SERVICE, async (ctx: BotContext) => {
    if (!hasDbUser(ctx) || !hasLanguage(ctx)) return;

    const matchResult = extractCallbackMatch(
      ctx,
      CALLBACK_PATTERNS.BOARD_BUY_SERVICE,
    );
    if (!matchResult) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, serviceIndexStr] = matchResult.match;
    if (!serviceIndexStr) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const serviceIndex = Number.parseInt(serviceIndexStr, 10);
    if (!isServiceIndex(serviceIndex)) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const gameState = await getUserGameState(ctx.dbUser.telegram_id);
    if (
      gameState?.currentUnlockItemType !== "service" ||
      gameState.currentUnlockItemIndex !== serviceIndex
    ) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_invalid_callback"),
      );
      return;
    }

    const service = getServiceByIndex(serviceIndex);
    if (!service) {
      await ctx.answerCbQuery(
        getText(ctx.dbUser.language, "error_service_not_found"),
      );
      return;
    }

    const buyResult = await buyService({
      userId: ctx.dbUser.telegram_id,
      serviceIndex,
      cost: service.cost,
    });

    if (!buyResult.success) {
      await handleBuyError({
        ctx,
        result: buyResult,
        alreadyOwnedKey: "error_service_already_owned",
        notFoundKey: "error_service_not_found",
      });
      return;
    }

    await clearUnlockedItem(ctx.dbUser.telegram_id);

    const serviceName = getText(ctx.dbUser.language, service.nameKey);
    const message = getText(ctx.dbUser.language, "service_purchased")
      .replace("{service}", serviceName)
      .replace("{cost}", String(service.cost));

    await ctx.answerCbQuery(getText(ctx.dbUser.language, "board_purchased"));
    await ctx.deleteMessage();
    await ctx.reply(message, {
      reply_markup: getBoardKeyboard(ctx.dbUser.language, false),
    });
  });
}
