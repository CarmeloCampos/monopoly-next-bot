import type { MaybeUndefined } from "@/types";

export type PropertyLevel = 1 | 2 | 3 | 4;

export type PropertyColor = "brown" | "orange" | "red" | "blue";

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

const UPGRADE_COSTS: Record<PropertyLevel, Record<PropertyColor, number>> = {
  1: { brown: 3000, orange: 5000, red: 7500, blue: 10000 },
  2: { brown: 7000, orange: 11000, red: 15500, blue: 20000 },
  3: { brown: 15000, orange: 21000, red: 27500, blue: 35000 },
  4: { brown: 27000, orange: 36000, red: 47500, blue: 60000 },
};

export function getPropertyCost(
  index: PropertyIndex,
  level: PropertyLevel,
): MaybeUndefined<number> {
  const property = getPropertyByIndex(index);
  if (!property) return undefined;

  return UPGRADE_COSTS[level]?.[property.color] ?? undefined;
}

export const PROPERTY_COUNT_BY_COLOR: Record<PropertyColor, number> = {
  brown: 4,
  orange: 3,
  red: 3,
  blue: 2,
};

export const COLOR_COMPLETION_BOOSTS: Record<
  PropertyColor,
  { level3: number; level4: number }
> = {
  brown: { level3: 0.15, level4: 0.25 },
  orange: { level3: 0.2, level4: 0.3 },
  red: { level3: 0.2, level4: 0.3 },
  blue: { level3: 0.25, level4: 0.4 },
};
