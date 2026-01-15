export const PROPERTY_COLORS = ["blue", "red", "orange", "brown"] as const;
export type PropertyColor = (typeof PROPERTY_COLORS)[number];

export const PROPERTY_LEVELS = [1, 2, 3, 4] as const;
export type PropertyLevel = (typeof PROPERTY_LEVELS)[number];

export const PROPERTY_COUNT_BY_COLOR: Record<PropertyColor, number> = {
  blue: 2,
  red: 3,
  orange: 3,
  brown: 4,
};

export const BASE_COSTS: Record<PropertyColor, number> = {
  brown: 3000,
  orange: 5000,
  red: 7500,
  blue: 10000,
};

export const UPGRADE_COSTS: Record<
  PropertyColor,
  readonly [number, number, number, number]
> = {
  brown: [0, 4000, 8000, 12000],
  orange: [0, 6000, 10000, 15000],
  red: [0, 8000, 12000, 20000],
  blue: [0, 10000, 15000, 25000],
};

export const HOURLY_INCOME: Record<
  PropertyColor,
  readonly [number, number, number, number]
> = {
  brown: [1.86, 5.25, 14.58, 28.67],
  orange: [3.1, 7.88, 18.23, 35.83],
  red: [4.65, 10.5, 21.88, 47.78],
  blue: [6.19, 13.13, 27.3, 59.72],
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

export function getPropertyCost(
  color: PropertyColor,
  level: PropertyLevel,
): number {
  const levelIndex = (level - 1) as 0 | 1 | 2 | 3;
  return BASE_COSTS[color] + UPGRADE_COSTS[color][levelIndex];
}

export function getPropertyHourlyIncome(
  color: PropertyColor,
  level: PropertyLevel,
): number {
  const levelIndex = (level - 1) as 0 | 1 | 2 | 3;
  return HOURLY_INCOME[color][levelIndex];
}

export function getPropertyMinuteIncome(
  color: PropertyColor,
  level: PropertyLevel,
): number {
  return getPropertyHourlyIncome(color, level) / 60;
}
