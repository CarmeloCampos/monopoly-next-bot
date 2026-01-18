import { getUserProperties } from "@/services/property";
import { getUserServices } from "@/services/service";
import { type PropertyIndex } from "@/constants/properties";
import { STARTER_PROPERTY_INDEX } from "@/constants/game";
import { ALL_SERVICE_INDICES, type ServiceIndex } from "@/constants/services";
import type { TelegramId } from "@/types";

interface DiceResult {
  roll: number;
  itemType: "property" | "service";
  itemIndex: number;
}

type RollDiceErrorCode =
  | "no_services_available"
  | "no_properties_available"
  | "selection_failed";

export type RollDiceResult =
  | { success: true; data: DiceResult }
  | { success: false; code: RollDiceErrorCode };

const PROPERTY_INDICES: PropertyIndex[] = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
];

export async function rollDice(userId: TelegramId): Promise<RollDiceResult> {
  const roll = Math.floor(Math.random() * 6) + 1;

  if (roll <= 4) {
    const availableServices = await getAvailableServices(userId);
    if (availableServices.length === 0) {
      return { success: false, code: "no_services_available" };
    }
    const serviceIndex =
      availableServices[Math.floor(Math.random() * availableServices.length)];
    if (serviceIndex === undefined) {
      return { success: false, code: "selection_failed" };
    }
    return {
      success: true,
      data: { roll, itemType: "service", itemIndex: serviceIndex },
    };
  } else {
    const availableProperties = await getAvailableProperties(userId);
    if (availableProperties.length === 0) {
      return { success: false, code: "no_properties_available" };
    }
    const propertyIndex =
      availableProperties[
        Math.floor(Math.random() * availableProperties.length)
      ];
    if (propertyIndex === undefined) {
      return { success: false, code: "selection_failed" };
    }
    return {
      success: true,
      data: { roll, itemType: "property", itemIndex: propertyIndex },
    };
  }
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
