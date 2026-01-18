import { db } from "@/db";
import { userServices } from "@/db/schema";
import { info } from "@/utils/logger";
import { checkAndDeductBalance } from "@/utils/transaction";

import { type TelegramId, type MonopolyCoins, type BuyResult } from "@/types";
import { getServiceByIndex, type ServiceIndex } from "@/constants/services";

interface BuyServiceParams {
  userId: TelegramId;
  serviceIndex: ServiceIndex;
  cost: MonopolyCoins;
}

export async function buyService(params: BuyServiceParams): Promise<BuyResult> {
  const { userId, serviceIndex, cost } = params;

  const service = getServiceByIndex(serviceIndex);
  if (!service) {
    return { success: false, code: "not_found" };
  }

  if (await userHasService(userId, serviceIndex)) {
    return { success: false, code: "already_owned" };
  }

  if (cost > 0) {
    const balanceResult = await checkAndDeductBalance(
      userId,
      cost,
      `Purchase: ${service.nameKey}`,
    );
    if (!balanceResult.success) {
      return { success: false, code: "insufficient_balance", needed: cost };
    }
  }

  const now = new Date();
  await db.insert(userServices).values({
    user_id: userId,
    service_index: serviceIndex,
    purchased_at: now,
    created_at: now,
  });

  info("Service purchased", {
    userId,
    serviceIndex,
    serviceName: service.nameKey,
    cost,
  });

  return { success: true };
}

async function userHasService(
  userId: TelegramId,
  serviceIndex: ServiceIndex,
): Promise<boolean> {
  const existing = await db.query.userServices.findFirst({
    where: (fields, { eq, and }) =>
      and(eq(fields.user_id, userId), eq(fields.service_index, serviceIndex)),
  });

  return existing !== undefined;
}

export async function getUserServices(
  userId: TelegramId,
): Promise<{ service_index: number; purchased_at: Date }[]> {
  const services = await db.query.userServices.findMany({
    where: (fields, { eq }) => eq(fields.user_id, userId),
    columns: {
      service_index: true,
      purchased_at: true,
    },
    orderBy: (fields, { asc }) => asc(fields.service_index),
  });

  return services;
}
