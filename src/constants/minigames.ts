import type { MonopolyCoins } from "@/types/utils";

export type MinigameType =
  | "dice"
  | "darts"
  | "basketball"
  | "bowling"
  | "slots";

export type DiceEmoji = "🎲" | "🎯" | "🏀" | "🎳" | "🎰";

interface MinigameConfig {
  emoji: DiceEmoji;
  type: MinigameType;
  nameKey: string;
  infoKey: string;
  minValue: number;
  maxValue: number;
}

interface MinigameMultiplier {
  winThreshold?: number[];
  multiplier: number;
  descriptionKey: string;
}

export const MINIGAMES: Record<MinigameType, MinigameConfig> = {
  dice: {
    emoji: "🎲",
    type: "dice",
    nameKey: "minigame_dice",
    infoKey: "minigame_dice_info",
    minValue: 1,
    maxValue: 6,
  },
  darts: {
    emoji: "🎯",
    type: "darts",
    nameKey: "minigame_darts",
    infoKey: "minigame_darts_info",
    minValue: 1,
    maxValue: 6,
  },
  basketball: {
    emoji: "🏀",
    type: "basketball",
    nameKey: "minigame_basketball",
    infoKey: "minigame_basketball_info",
    minValue: 1,
    maxValue: 5,
  },
  bowling: {
    emoji: "🎳",
    type: "bowling",
    nameKey: "minigame_bowling",
    infoKey: "minigame_bowling_info",
    minValue: 1,
    maxValue: 6,
  },
  slots: {
    emoji: "🎰",
    type: "slots",
    nameKey: "minigame_slots",
    infoKey: "minigame_slots_info",
    minValue: 1,
    maxValue: 64,
  },
} as const;

export const MINIGAME_MULTIPLIERS: Record<MinigameType, MinigameMultiplier[]> =
  {
    dice: [
      {
        winThreshold: undefined,
        multiplier: 5,
        descriptionKey: "minigame_dice_multiplier",
      },
    ],
    darts: [
      {
        winThreshold: [6],
        multiplier: 4,
        descriptionKey: "minigame_darts_center",
      },
      {
        winThreshold: [5],
        multiplier: 1,
        descriptionKey: "minigame_darts_second",
      },
    ],
    basketball: [
      {
        winThreshold: [4, 5],
        multiplier: 2,
        descriptionKey: "minigame_basketball_score",
      },
    ],
    bowling: [
      {
        winThreshold: [6],
        multiplier: 4,
        descriptionKey: "minigame_bowling_strike",
      },
      {
        winThreshold: [5],
        multiplier: 1,
        descriptionKey: "minigame_bowling_spare",
      },
    ],
    slots: [
      {
        winThreshold: [64],
        multiplier: 20,
        descriptionKey: "minigame_slots_jackpot",
      },
      {
        winThreshold: [1, 8, 15, 22, 29, 36, 43, 50, 57],
        multiplier: 4,
        descriptionKey: "minigame_slots_triple",
      },
    ],
  } as const;

export const BET_LIMITS = {
  min: 1 as MonopolyCoins,
  max: Infinity,
} as const satisfies { min: MonopolyCoins; max: number };

export const ANIMATION_DELAY_MS = 3000 as const;

export const BET_ADJUSTMENTS = [-10, -5, 5, 10] as const;

export const BET_MULTIPLIERS = [0.5, 2, 4, 6] as const;
