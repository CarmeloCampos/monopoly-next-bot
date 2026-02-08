import type { BotContextWithLanguage } from "@/types";
import { getText } from "@/i18n";
import {
  getMinigamesKeyboard,
  getDicePickKeyboard,
  getQuickPlayKeyboard,
} from "@/keyboards";
import {
  MINIGAMES,
  BET_LIMITS,
  ANIMATION_DELAY_MS,
  type MinigameType,
} from "@/constants/minigames";
import {
  setMinigameState,
  updateMinigameState,
  getMinigameState,
  clearMinigameState,
  type MinigameState,
} from "@/services/minigame-state";
import {
  checkAndDeductBalance,
  addBalanceAndTransaction,
  addMinigameLog,
} from "@/utils/transaction";
import { calculateGameResult, formatWinnings } from "@/services/minigame";
import { asMonopolyCoins } from "@/types/utils";
import { info } from "@/utils/logger";

/**
 * Type guard to validate if a string is a valid MinigameType
 * @param value - The value to check
 * @returns True if the value is a valid MinigameType
 */
function isMinigameType(value: string): value is MinigameType {
  return value in MINIGAMES;
}

/**
 * Displays the minigame selection menu
 * @param ctx - Bot context with language
 */
export async function handleMinigames(
  ctx: BotContextWithLanguage,
): Promise<void> {
  const { dbUser } = ctx;

  await ctx.reply(getText(dbUser.language, "minigames_title"), {
    reply_markup: getMinigamesKeyboard(dbUser.language),
  });
}

/**
 * Handles minigame selection and initiates the appropriate game flow
 * @param ctx - Bot context with language
 * @param gameType - The type of minigame selected
 */
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

/**
 * Handles dice number selection for the dice minigame
 * @param ctx - Bot context with language
 * @param pickedNumber - The number selected (1-6)
 */
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

/**
 * Handles bet amount input for minigames
 * @param ctx - Bot context with language
 * @param amount - The bet amount entered by the user
 */
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

/**
 * Sends the quick play prompt with the appropriate keyboard
 * @param ctx - Bot context with language
 * @param gameState - Current minigame state
 */
async function sendQuickPlayPrompt(
  ctx: BotContextWithLanguage,
  gameState: MinigameState,
): Promise<void> {
  const promptMessage = getText(
    ctx.dbUser.language,
    "minigame_quick_play_prompt",
  ).replace("{emoji}", gameState.expectedEmoji);

  await ctx.reply(promptMessage, {
    reply_markup: getQuickPlayKeyboard(
      ctx.dbUser.language,
      gameState.betAmount ?? BET_LIMITS.min,
    ),
  });
}

/**
 * Processes and displays the minigame result (win/lose)
 * @param ctx - Bot context with language
 * @param gameState - Current minigame state
 * @param result - Game result with winnings and multiplier
 */
async function processGameResult(
  ctx: BotContextWithLanguage,
  gameState: MinigameState,
  result: ReturnType<typeof calculateGameResult>,
): Promise<void> {
  if (result.won) {
    await addBalanceAndTransaction(
      ctx.dbUser.telegram_id,
      result.winnings,
      "minigame_winning",
      `Win in ${gameState.game}`,
    );

    let message = getText(ctx.dbUser.language, "minigame_result_win")
      .replace("{amount}", formatWinnings(result.winnings))
      .replace("{multiplier}", String(result.multiplier));

    if (result.descriptionKey) {
      message += `\n${getText(ctx.dbUser.language, result.descriptionKey)}`;
    }

    await ctx.reply(message);
  } else {
    await ctx.reply(getText(ctx.dbUser.language, "minigame_result_lose"));
  }

  const balanceMessage = getText(
    ctx.dbUser.language,
    "minigame_balance",
  ).replace("{balance}", String(ctx.dbUser.balance + result.winnings));

  await ctx.reply(balanceMessage);
}

/**
 * Handles the completion of a minigame and displays results
 * @param ctx - Bot context with language
 * @param diceValue - The dice value rolled
 * @param diceEmoji - The emoji that was sent
 */
export async function handleGameResult(
  ctx: BotContextWithLanguage,
  diceValue: number,
  diceEmoji: string,
): Promise<void> {
  const { dbUser } = ctx;
  const gameState = getMinigameState(dbUser.telegram_id);

  if (
    !gameState ||
    (gameState.phase !== "awaiting_emoji" &&
      gameState.phase !== "ready_to_play")
  ) {
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

  await Bun.sleep(ANIMATION_DELAY_MS);

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

  info("Minigame result", {
    userId: dbUser.telegram_id,
    game: gameState.game,
    result: result.won ? "win" : "lose",
    winnings: result.winnings,
  });

  await processGameResult(ctx, gameState, result);

  // Transition to ready_to_play phase and send prompt
  if (gameState.phase === "awaiting_emoji") {
    updateMinigameState(dbUser.telegram_id, {
      phase: "ready_to_play",
    });
  }

  const gameStateUpdated = getMinigameState(dbUser.telegram_id);
  if (!gameStateUpdated) return;

  await sendQuickPlayPrompt(ctx, gameStateUpdated);
}

/**
 * Handles minigame cancellation with refund if applicable
 * @param ctx - Bot context with language
 */
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

/**
 * Handles bet adjustment requests from the quick play keyboard
 * @param ctx - Bot context with language
 * @param adjustment - Amount to adjust the bet (positive or negative)
 */
export async function handleBetAdjust(
  ctx: BotContextWithLanguage,
  adjustment: number,
): Promise<void> {
  const { dbUser } = ctx;
  const gameState = getMinigameState(dbUser.telegram_id);

  if (!gameState || gameState.phase !== "ready_to_play") {
    await ctx.answerCbQuery("❌ No tienes un juego activo");
    return;
  }

  if (adjustment === 0) {
    await ctx.answerCbQuery();
    return;
  }

  const newBet = (gameState.betAmount ?? BET_LIMITS.min) + adjustment;

  if (newBet < BET_LIMITS.min) {
    await ctx.answerCbQuery(
      getText(dbUser.language, "minigame_bet_too_low").replace(
        "{min}",
        String(BET_LIMITS.min),
      ),
    );
    return;
  }

  updateMinigameState(dbUser.telegram_id, {
    betAmount: newBet,
  });

  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(
    getQuickPlayKeyboard(dbUser.language, newBet),
  );
}

/**
 * Handles exit from quick play mode, clearing the game state and returning to minigame menu
 * @param ctx - Bot context with language
 */
export async function handleMinigameExit(
  ctx: BotContextWithLanguage,
): Promise<void> {
  const { dbUser } = ctx;
  const gameState = getMinigameState(dbUser.telegram_id);

  if (gameState?.phase === "ready_to_play") {
    clearMinigameState(dbUser.telegram_id);
  }

  await ctx.answerCbQuery();
  await handleMinigames(ctx);
}
