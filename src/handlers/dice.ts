import { Telegraf } from "telegraf";
import { type BotContext, hasDbUser, hasLanguage } from "@/types";
import { info } from "@/utils/logger";
import { getMinigameState } from "@/services/minigame-state";
import { handleGameResult } from "./commands/minigames-menu";

export const registerDiceHandler = (bot: Telegraf<BotContext>): void => {
  bot.on("dice", async (ctx: BotContext) => {
    if (!hasDbUser(ctx)) return;
    if (!hasLanguage(ctx)) return;
    if (!ctx.message || !("dice" in ctx.message)) return;

    const { dbUser } = ctx;
    const diceMessage = ctx.message.dice;

    if (!diceMessage) return;

    const { emoji, value } = diceMessage;

    const gameState = getMinigameState(dbUser.telegram_id);

    if (!gameState || gameState.phase !== "awaiting_emoji") {
      info("Dice received but no active game", {
        userId: dbUser.telegram_id,
        emoji,
      });
      return;
    }

    if (emoji !== gameState.expectedEmoji) {
      info("Wrong emoji sent", {
        userId: dbUser.telegram_id,
        expected: gameState.expectedEmoji,
        received: emoji,
      });
      return;
    }

    info("Processing minigame result", {
      userId: dbUser.telegram_id,
      game: gameState.game,
      result: value,
    });

    await handleGameResult(ctx, value, emoji);
  });
};
