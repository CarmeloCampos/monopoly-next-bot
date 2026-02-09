import type { TelegramId, MaybeUndefined } from "@/types";
import type { MinigameType, DiceEmoji } from "@/constants/minigames";

export interface MinigameState {
  game: MinigameType;
  expectedEmoji: DiceEmoji;
  phase:
    | "selecting_number"
    | "awaiting_bet"
    | "awaiting_emoji"
    | "ready_to_play";
  betAmount?: number;
  pickedNumber?: number;
}

/**
 * In-memory storage for active minigame sessions.
 *
 * NOTE: This is intentionally in-memory storage for short-lived game state.
 * Unlike persistent data (users, properties, etc.), minigame sessions:
 * - Last only a few seconds to minutes
 * - Don't need to survive bot restarts
 * - Are cleared after game completion or cancellation
 *
 * If bot restarts mid-game, users simply need to start a new game.
 */
const activeGames = new Map<TelegramId, MinigameState>();

export function setMinigameState(
  userId: TelegramId,
  state: MinigameState,
): void {
  activeGames.set(userId, state);
}

export function getMinigameState(
  userId: TelegramId,
): MaybeUndefined<MinigameState> {
  return activeGames.get(userId);
}

export function clearMinigameState(userId: TelegramId): void {
  activeGames.delete(userId);
}

export function updateMinigameState(
  userId: TelegramId,
  updates: Partial<MinigameState>,
): void {
  const state = activeGames.get(userId);
  if (state) {
    activeGames.set(userId, { ...state, ...updates });
  }
}

export function isAwaitingBet(userId: TelegramId): boolean {
  const state = activeGames.get(userId);
  return state?.phase === "awaiting_bet";
}
