export const SERVICE_TYPES = [
  "train",
  "light",
  "water",
  "cinema",
  "museum",
  "gas_station",
  "pharmacy",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const TRAIN_BOOSTS: Record<2 | 3 | 4, number> = {
  2: 0.1,
  3: 0.2,
  4: 0.35,
};

export function getTrainBoost(trainCount: number): number {
  if (trainCount >= 4) return TRAIN_BOOSTS[4];
  if (trainCount === 3) return TRAIN_BOOSTS[3];
  if (trainCount === 2) return TRAIN_BOOSTS[2];
  return 0;
}
