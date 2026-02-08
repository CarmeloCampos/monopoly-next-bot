import { Telegraf } from "telegraf";
import { type BotContext, hasDbUser, hasLanguage } from "@/types";
import { info } from "@/utils/logger";
import { getMinigameState } from "@/services/minigame-state";
import { handleGameResult } from "./commands/minigames-menu";
import { checkAndDeductBalance } from "@/utils/transaction";
import { asMonopolyCoins } from "@/types/utils";
import { getText } from "@/i18n";

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

    if (
      !gameState ||
      (gameState.phase !== "awaiting_emoji" &&
        gameState.phase !== "ready_to_play")
    ) {
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

    if (gameState.phase === "ready_to_play") {
      const deductionResult = await checkAndDeductBalance(
        dbUser.telegram_id,
        asMonopolyCoins(gameState.betAmount ?? 0),
        "minigame_bet",
      );

      if (!deductionResult.success) {
        await ctx.reply(
          getText(dbUser.language, "minigame_bet_insufficient").replace(
            "{balance}",
            String(dbUser.balance),
          ),
        );
        return;
      }

      info("Minigame bet deducted in quick play mode", {
        userId: dbUser.telegram_id,
        game: gameState.game,
        betAmount: gameState.betAmount,
      });
    }

    info("Processing minigame result", {
      userId: dbUser.telegram_id,
      game: gameState.game,
      result: value,
    });

    await handleGameResult(ctx, value, emoji);
  });
};
