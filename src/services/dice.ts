import { getUserProperties } from "@/services/property";
import { getUserServices } from "@/services/service";
import { type PropertyIndex } from "@/constants/properties";
import { STARTER_PROPERTY_INDEX } from "@/constants/game";
import { ALL_SERVICE_INDICES, type ServiceIndex } from "@/constants/services";
import type { TelegramId, MaybeUndefined } from "@/types";

interface DiceResult {
  roll: number;
  itemType: "property" | "service";
  itemIndex: number;
}

type RollDiceErrorCode = "no_items_available" | "selection_failed";

export type RollDiceResult =
  | { success: true; data: DiceResult }
  | { success: false; code: RollDiceErrorCode };

const PROPERTY_INDICES: readonly PropertyIndex[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
];

/**
 * Selects a random element from an array.
 * @returns The selected element or undefined if array is empty
 */
function selectRandomElement<T>(array: readonly T[]): MaybeUndefined<T> {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Creates a successful dice result.
 */
function createDiceResult(
  roll: number,
  itemType: DiceResult["itemType"],
  itemIndex: number,
): RollDiceResult {
  return {
    success: true,
    data: { roll, itemType, itemIndex },
  };
}

/**
 * Attempts to select a service from available services.
 */
function trySelectService(
  availableServices: readonly ServiceIndex[],
  roll: number,
): MaybeUndefined<RollDiceResult> {
  const serviceIndex = selectRandomElement(availableServices);
  if (serviceIndex === undefined) return undefined;
  return createDiceResult(roll, "service", serviceIndex);
}

/**
 * Attempts to select a property from available properties.
 */
function trySelectProperty(
  availableProperties: readonly PropertyIndex[],
  roll: number,
): MaybeUndefined<RollDiceResult> {
  const propertyIndex = selectRandomElement(availableProperties);
  if (propertyIndex === undefined) return undefined;
  return createDiceResult(roll, "property", propertyIndex);
}

export async function rollDice(userId: TelegramId): Promise<RollDiceResult> {
  const roll = Math.floor(Math.random() * 6) + 1;

  const [availableServices, availableProperties] = await Promise.all([
    getAvailableServices(userId),
    getAvailableProperties(userId),
  ]);

  const preferService = roll <= 4;
  let result: MaybeUndefined<RollDiceResult>;

  if (preferService) {
    result = trySelectService(availableServices, roll);
    if (result) return result;

    result = trySelectProperty(availableProperties, roll);
    if (result) return result;
  } else {
    result = trySelectProperty(availableProperties, roll);
    if (result) return result;

    result = trySelectService(availableServices, roll);
    if (result) return result;
  }

  return { success: false, code: "no_items_available" };
}

async function getAvailableServices(
  userId: TelegramId,
): Promise<ServiceIndex[]> {
  const ownedServices = await getUserServices(userId);
  const ownedIndices = new Set(ownedServices.map((s) => s.service_index));
  return ALL_SERVICE_INDICES.filter((i) => !ownedIndices.has(i));
}

async function getAvailableProperties(
  userId: TelegramId,
): Promise<PropertyIndex[]> {
  const ownedProperties = await getUserProperties(userId);
  const ownedIndices = new Set(ownedProperties.map((p) => p.property_index));
  return PROPERTY_INDICES.filter(
    (i) => i !== STARTER_PROPERTY_INDEX && !ownedIndices.has(i),
  );
}
