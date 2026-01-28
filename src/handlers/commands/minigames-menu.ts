import type { BotContextWithLanguage } from "@/types";
import { getText } from "@/i18n";
import { getMinigamesKeyboard, getDicePickKeyboard } from "@/keyboards";
import {
  MINIGAMES,
  BET_LIMITS,
  type MinigameType,
} from "@/constants/minigames";
import {
  setMinigameState,
  updateMinigameState,
  getMinigameState,
  clearMinigameState,
} from "@/services/minigame-state";
import {
  checkAndDeductBalance,
  addBalanceAndTransaction,
  addMinigameLog,
} from "@/utils/transaction";
import { calculateGameResult, formatWinnings } from "@/services/minigame";
import { asMonopolyCoins } from "@/types/utils";
import { info } from "@/utils/logger";

/** Type guard to validate if a string is a valid MinigameType */
function isMinigameType(value: string): value is MinigameType {
  return value in MINIGAMES;
}

export async function handleMinigames(
  ctx: BotContextWithLanguage,
): Promise<void> {
  const { dbUser } = ctx;

  await ctx.reply(getText(dbUser.language, "minigames_title"), {
    reply_markup: getMinigamesKeyboard(dbUser.language),
  });
}

export async function handleMinigameSelection(
  ctx: BotContextWithLanguage,
  gameType: string,
): Promise<void> {
  const { dbUser } = ctx;

  if (!isMinigameType(gameType)) {
    await ctx.answerCbQuery("❌ Juego no encontrado");
    return;
  }

  const config = MINIGAMES[gameType];

  if (gameType === "dice") {
    setMinigameState(dbUser.telegram_id, {
      game: "dice",
      expectedEmoji: "🎲",
      phase: "selecting_number",
    });

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `${getText(dbUser.language, "minigame_dice_pick")}\n\n${getText(
        dbUser.language,
        "minigame_dice_info",
      )}`,
      {
        reply_markup: getDicePickKeyboard(dbUser.language),
      },
    );
  } else {
    setMinigameState(dbUser.telegram_id, {
      game: gameType,
      expectedEmoji: config.emoji,
      phase: "awaiting_bet",
    });

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `${getText(dbUser.language, config.infoKey)}\n\n${getText(
        dbUser.language,
        "minigame_enter_bet",
      )}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: getText(dbUser.language, "btn_back"),
                callback_data: "minigame_cancel",
              },
            ],
          ],
        },
      },
    );
  }
}

export async function handleDiceNumberPick(
  ctx: BotContextWithLanguage,
  pickedNumber: number,
): Promise<void> {
  const { dbUser } = ctx;

  updateMinigameState(dbUser.telegram_id, {
    phase: "awaiting_bet",
    pickedNumber,
  });

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `${getText(dbUser.language, "minigame_dice_info")}\n\n${getText(
      dbUser.language,
      "minigame_selected_number",
    ).replace(
      "{number}",
      String(pickedNumber),
    )}\n\n${getText(dbUser.language, "minigame_enter_bet")}`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: getText(dbUser.language, "btn_back"),
              callback_data: "minigame_cancel",
            },
          ],
        ],
      },
    },
  );
}

export async function handleBetAmount(
  ctx: BotContextWithLanguage,
  amount: number,
): Promise<void> {
  const { dbUser } = ctx;
  const gameState = getMinigameState(dbUser.telegram_id);

  if (!gameState || gameState.phase !== "awaiting_bet") {
    await ctx.reply(getText(dbUser.language, "invalid_message"));
    return;
  }

  if (isNaN(amount) || amount < BET_LIMITS.min) {
    await ctx.reply(
      getText(dbUser.language, "minigame_bet_min").replace(
        "{min}",
        String(BET_LIMITS.min),
      ),
    );
    return;
  }

  if (!isFinite(amount) || amount < 0) {
    await ctx.reply(getText(dbUser.language, "minigame_bet_invalid"));
    return;
  }

  const deductionResult = await checkAndDeductBalance(
    dbUser.telegram_id,
    asMonopolyCoins(amount),
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

  updateMinigameState(dbUser.telegram_id, {
    phase: "awaiting_emoji",
    betAmount: amount,
  });

  const gameStateUpdated = getMinigameState(dbUser.telegram_id);
  if (!gameStateUpdated) return;

  const sendEmojiKey = `minigame_send_emoji_${gameStateUpdated.game}`;

  await ctx.reply(
    `${getText(dbUser.language, "minigame_bet_registered").replace(
      "{amount}",
      String(amount),
    )}\n\n${getText(dbUser.language, sendEmojiKey)}`,
  );
}

export async function handleGameResult(
  ctx: BotContextWithLanguage,
  diceValue: number,
  diceEmoji: string,
): Promise<void> {
  const { dbUser } = ctx;
  const gameState = getMinigameState(dbUser.telegram_id);

  if (!gameState || gameState.phase !== "awaiting_emoji") {
    return;
  }

  if (diceEmoji !== gameState.expectedEmoji) {
    await ctx.reply(
      getText(dbUser.language, "minigame_wrong_emoji").replace(
        "{expected}",
        gameState.expectedEmoji,
      ),
    );
    return;
  }

  const result = calculateGameResult(
    gameState.game,
    asMonopolyCoins(gameState.betAmount ?? 0),
    diceValue,
    gameState.pickedNumber,
  );

  await addMinigameLog(
    dbUser.telegram_id,
    gameState.game,
    asMonopolyCoins(gameState.betAmount ?? 0),
    String(diceValue),
    result.winnings,
  );

  clearMinigameState(dbUser.telegram_id);

  info("Minigame result", {
    userId: dbUser.telegram_id,
    game: gameState.game,
    result: result.won ? "win" : "lose",
    winnings: result.winnings,
  });

  if (result.won) {
    await addBalanceAndTransaction(
      dbUser.telegram_id,
      result.winnings,
      "minigame_winning",
      `Win in ${gameState.game}`,
    );

    let message = getText(dbUser.language, "minigame_result_win")
      .replace("{amount}", formatWinnings(result.winnings))
      .replace("{multiplier}", String(result.multiplier));

    if (result.descriptionKey) {
      message += `\n${getText(dbUser.language, result.descriptionKey)}`;
    }

    await ctx.reply(message);
  } else {
    await ctx.reply(getText(dbUser.language, "minigame_result_lose"));
  }

  const balanceMessage = getText(dbUser.language, "minigame_balance").replace(
    "{balance}",
    String(dbUser.balance + result.winnings),
  );

  await ctx.reply(balanceMessage);
}

export async function handleMinigameCancel(
  ctx: BotContextWithLanguage,
): Promise<void> {
  const { dbUser } = ctx;
  const gameState = getMinigameState(dbUser.telegram_id);

  if (gameState?.phase === "awaiting_emoji" && gameState.betAmount) {
    await addBalanceAndTransaction(
      dbUser.telegram_id,
      asMonopolyCoins(gameState.betAmount),
      "minigame_refund",
      "Refunded minigame bet",
    );
  }

  clearMinigameState(dbUser.telegram_id);

  await ctx.answerCbQuery();
  await handleMinigames(ctx);
}
