import type { Language } from "@/types";

export type PropertyLevel = 1 | 2 | 3 | 4;

type PropertyColor = "brown" | "orange" | "red" | "blue";

export interface PropertyInfo {
  nameKey: string;
  color: PropertyColor;
  incomePerLevel: [number, number, number, number];
}

const PROPERTIES: PropertyInfo[] = [
  {
    nameKey: "property_casa_blanca",
    color: "brown",
    incomePerLevel: [1.86, 5.25, 14.58, 28.67],
  },
  {
    nameKey: "property_anne_frank",
    color: "brown",
    incomePerLevel: [1.86, 5.25, 14.58, 28.67],
  },
  {
    nameKey: "property_fallingwater",
    color: "brown",
    incomePerLevel: [1.86, 5.25, 14.58, 28.67],
  },
  {
    nameKey: "property_winchester",
    color: "brown",
    incomePerLevel: [1.86, 5.25, 14.58, 28.67],
  },
  {
    nameKey: "property_marina_bay",
    color: "orange",
    incomePerLevel: [3.1, 7.88, 18.23, 35.83],
  },
  {
    nameKey: "property_sydney_opera",
    color: "orange",
    incomePerLevel: [3.1, 7.88, 18.23, 35.83],
  },
  {
    nameKey: "property_rohrmoser",
    color: "orange",
    incomePerLevel: [3.1, 7.88, 18.23, 35.83],
  },
  {
    nameKey: "property_burj_khalifa",
    color: "red",
    incomePerLevel: [4.65, 10.5, 21.88, 47.78],
  },
  {
    nameKey: "property_taipei_101",
    color: "red",
    incomePerLevel: [4.65, 10.5, 21.88, 47.78],
  },
  {
    nameKey: "property_santa_rosa",
    color: "red",
    incomePerLevel: [4.65, 10.5, 21.88, 47.78],
  },
  {
    nameKey: "property_world_trade_center",
    color: "blue",
    incomePerLevel: [6.19, 13.13, 27.3, 59.72],
  },
  {
    nameKey: "property_the_shard",
    color: "blue",
    incomePerLevel: [6.19, 13.13, 27.3, 59.72],
  },
  {
    nameKey: "property_emprender",
    color: "brown",
    incomePerLevel: [33.33, 33.33, 33.33, 33.33],
  },
] as const;

export type PropertyIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12;

export function getPropertyByIndex(
  index: PropertyIndex,
): PropertyInfo | undefined {
  if (index < 0 || index >= PROPERTIES.length) return undefined;
  return PROPERTIES[index];
}

export function getPropertyIncome(
  index: PropertyIndex,
  level: PropertyLevel,
): number | undefined {
  const property = getPropertyByIndex(index);
  if (!property) return undefined;

  const levelIndex = level - 1;
  if (levelIndex < 0 || levelIndex >= property.incomePerLevel.length) {
    return undefined;
  }

  return property.incomePerLevel[levelIndex];
}

export function formatIncome(
  hourlyIncome: number,
  _language: Language,
): string {
  const monthlyIncome = hourlyIncome * 24 * 30;
  return `${hourlyIncome.toFixed(2)} MC/h (~${monthlyIncome.toFixed(0)} MC/mes)`;
}
