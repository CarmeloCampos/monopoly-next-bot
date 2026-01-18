import {
  asMonopolyCoins,
  type MonopolyCoins,
  type MaybeUndefined,
} from "@/types/utils";

export type ServiceType = "train" | "light" | "water" | "commercial";

export interface ServiceInfo {
  nameKey: string;
  type: ServiceType;
  cost: MonopolyCoins;
  boostPercentage: number;
}

const SERVICES: ServiceInfo[] = [
  {
    nameKey: "service_train_orient",
    type: "train",
    cost: asMonopolyCoins(3000),
    boostPercentage: 0,
  },
  {
    nameKey: "service_train_transiberiano",
    type: "train",
    cost: asMonopolyCoins(3000),
    boostPercentage: 0,
  },
  {
    nameKey: "service_train_bullet",
    type: "train",
    cost: asMonopolyCoins(3000),
    boostPercentage: 0,
  },
  {
    nameKey: "service_train_polar",
    type: "train",
    cost: asMonopolyCoins(3000),
    boostPercentage: 0,
  },
  {
    nameKey: "service_light_itaipu",
    type: "light",
    cost: asMonopolyCoins(3000),
    boostPercentage: 5,
  },
  {
    nameKey: "service_light_chernobyl",
    type: "light",
    cost: asMonopolyCoins(3000),
    boostPercentage: 5,
  },
  {
    nameKey: "service_water_segovia",
    type: "water",
    cost: asMonopolyCoins(3000),
    boostPercentage: 5,
  },
  {
    nameKey: "service_water_arcos",
    type: "water",
    cost: asMonopolyCoins(3000),
    boostPercentage: 5,
  },
  {
    nameKey: "service_cinema",
    type: "commercial",
    cost: asMonopolyCoins(5000),
    boostPercentage: 7,
  },
  {
    nameKey: "service_museum",
    type: "commercial",
    cost: asMonopolyCoins(5000),
    boostPercentage: 7,
  },
  {
    nameKey: "service_gas",
    type: "commercial",
    cost: asMonopolyCoins(4000),
    boostPercentage: 6,
  },
  {
    nameKey: "service_pharmacy",
    type: "commercial",
    cost: asMonopolyCoins(4000),
    boostPercentage: 6,
  },
] as const;

export type ServiceIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export const ALL_SERVICE_INDICES: ServiceIndex[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
];

export function getServiceByIndex(
  index: ServiceIndex,
): MaybeUndefined<ServiceInfo> {
  if (index < 0 || index >= SERVICES.length) return undefined;
  return SERVICES[index];
}

export function getServiceCost(index: ServiceIndex): number {
  const service = getServiceByIndex(index);
  return service?.cost ?? 0;
}

export function getServiceBoost(index: ServiceIndex): number {
  const service = getServiceByIndex(index);
  return service?.boostPercentage ?? 0;
}

export function getTrainBoost(trainCount: number): number {
  if (trainCount === 0) return 0;
  if (trainCount === 1) return 0;
  if (trainCount === 2) return 10;
  if (trainCount === 3) return 20;
  return 35;
}
