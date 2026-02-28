import { asMonopolyCoins, type MonopolyCoins } from "@/types/utils";
import { MINIGAME_MULTIPLIERS, type MinigameType } from "@/constants/minigames";

export interface GameResult {
  won: boolean;
  multiplier: number;
  winnings: MonopolyCoins;
  descriptionKey: string;
  resultValue: number;
}

export function calculateGameResult(
  gameType: MinigameType,
  betAmount: MonopolyCoins,
  diceValue: number,
  pickedNumber?: number,
): GameResult {
  const multipliers = MINIGAME_MULTIPLIERS[gameType];

  const [diceMultiplier] = MINIGAME_MULTIPLIERS.dice;
  if (!diceMultiplier) {
    return {
      won: false,
      multiplier: 0,
      winnings: asMonopolyCoins(0),
      descriptionKey: "",
      resultValue: diceValue,
    };
  }

  if (gameType === "dice" && pickedNumber !== undefined) {
    if (diceValue === pickedNumber) {
      return {
        won: true,
        multiplier: diceMultiplier.multiplier,
        winnings: asMonopolyCoins(betAmount * diceMultiplier.multiplier),
        descriptionKey: diceMultiplier.descriptionKey,
        resultValue: diceValue,
      };
    }
    return {
      won: false,
      multiplier: 0,
      winnings: asMonopolyCoins(0),
      descriptionKey: "",
      resultValue: diceValue,
    };
  }

  for (const multiplier of multipliers) {
    if (multiplier.winThreshold?.includes(diceValue)) {
      return {
        won: true,
        multiplier: multiplier.multiplier,
        winnings: asMonopolyCoins(betAmount * multiplier.multiplier),
        descriptionKey: multiplier.descriptionKey,
        resultValue: diceValue,
      };
    }
  }

  return {
    won: false,
    multiplier: 0,
    winnings: asMonopolyCoins(0),
    descriptionKey: "",
    resultValue: diceValue,
  };
}

export function formatWinnings(amount: MonopolyCoins): string {
  return `${amount.toLocaleString()} MC`;
}
