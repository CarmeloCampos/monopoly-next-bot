import { Telegraf } from "telegraf";
import { hasDbUser, hasLanguage, type BotContext } from "@/types";
import {
  extractCallbackMatch,
  answerUserNotFound,
  answerInvalidCallback,
} from "@/utils/callback-helpers";
import { CALLBACK_PATTERNS, CALLBACK_DATA } from "@/constants";
import {
  handleMinigameSelection,
  handleDiceNumberPick,
  handleMinigameCancel,
  handleBetAdjust,
  handleMinigameExit,
} from "../commands/minigames-menu";

export const registerMinigameCallbacks = (bot: Telegraf<BotContext>): void => {
  bot.action(CALLBACK_PATTERNS.MINIGAME_SELECT, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    const result = extractCallbackMatch(ctx, CALLBACK_PATTERNS.MINIGAME_SELECT);
    if (!result) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, gameType] = result.match;
    if (!gameType) {
      await answerInvalidCallback(ctx);
      return;
    }

    await handleMinigameSelection(ctx, gameType);
  });

  bot.action(CALLBACK_PATTERNS.MINIGAME_DICE_PICK, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    const result = extractCallbackMatch(
      ctx,
      CALLBACK_PATTERNS.MINIGAME_DICE_PICK,
    );
    if (!result) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, numberStr] = result.match;
    if (!numberStr) {
      await answerInvalidCallback(ctx);
      return;
    }

    const pickedNumber = Number.parseInt(numberStr, 10);

    await handleDiceNumberPick(ctx, pickedNumber);
  });

  bot.action(CALLBACK_DATA.MINIGAME_CANCEL, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    await handleMinigameCancel(ctx);
  });

  bot.action(CALLBACK_PATTERNS.MINIGAME_BET_ADJUST, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    const result = extractCallbackMatch(
      ctx,
      CALLBACK_PATTERNS.MINIGAME_BET_ADJUST,
    );
    if (!result) {
      await answerInvalidCallback(ctx);
      return;
    }

    const [, adjustmentStr] = result.match;
    if (!adjustmentStr) {
      await answerInvalidCallback(ctx);
      return;
    }

    const adjustment = Number.parseInt(adjustmentStr, 10);

    await handleBetAdjust(ctx, adjustment);
  });

  bot.action(CALLBACK_DATA.MINIGAME_EXIT, async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) {
      await answerUserNotFound(ctx);
      return;
    }

    if (!hasLanguage(ctx)) return;

    await handleMinigameExit(ctx);
  });
};
