import type { MaybeUndefined } from "@/types";

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
    incomePerLevel: [1.39, 1.39, 1.39, 1.39],
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
): MaybeUndefined<PropertyInfo> {
  if (index < 0 || index >= PROPERTIES.length) return undefined;
  return PROPERTIES[index];
}

export function getPropertyIncome(
  index: PropertyIndex,
  level: PropertyLevel,
): MaybeUndefined<number> {
  const property = getPropertyByIndex(index);
  if (!property) return undefined;

  const levelIndex = level - 1;
  if (levelIndex < 0 || levelIndex >= property.incomePerLevel.length) {
    return undefined;
  }

  return property.incomePerLevel[levelIndex];
}

const PROPERTY_COSTS: Record<PropertyIndex, number> = {
  0: 2750,
  1: 2750,
  2: 2750,
  3: 2750,
  4: 4600,
  5: 4600,
  6: 4600,
  7: 6900,
  8: 6900,
  9: 6900,
  10: 9200,
  11: 9200,
  12: 0,
} as const;

const UPGRADE_COSTS: Record<PropertyLevel, Record<PropertyColor, number>> = {
  1: { brown: 0, orange: 0, red: 0, blue: 0 },
  2: { brown: 3700, orange: 6100, red: 9200, blue: 12200 },
  3: { brown: 7400, orange: 10200, red: 13800, blue: 18400 },
  4: { brown: 11100, orange: 15300, red: 20700, blue: 27600 },
};

export function getPropertyCost(
  index: PropertyIndex,
  level: PropertyLevel,
): MaybeUndefined<number> {
  const property = getPropertyByIndex(index);
  if (!property) return undefined;

  if (level === 1) return PROPERTY_COSTS[index];

  const upgradeCost = UPGRADE_COSTS[level]?.[property.color];
  if (upgradeCost === undefined) {
    return PROPERTY_COSTS[index];
  }

  return PROPERTY_COSTS[index] + upgradeCost;
}
