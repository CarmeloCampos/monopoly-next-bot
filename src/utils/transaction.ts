import { db } from "@/db";
import { users, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { MonopolyCoins, TelegramId } from "@/types";

type BalanceCheckResult =
  | { success: false }
  | { success: true; userBalance: MonopolyCoins };

export async function checkAndDeductBalance(
  userId: TelegramId,
  cost: MonopolyCoins,
  description: string,
): Promise<BalanceCheckResult> {
  const user = await db.query.users.findFirst({
    where: (fields, { eq }) => eq(fields.telegram_id, userId),
    columns: { balance: true },
  });

  if (!user || user.balance < cost) {
    return { success: false };
  }

  const now = new Date();

  await db
    .update(users)
    .set({
      balance: sql`balance - ${cost}`,
      updated_at: now,
    })
    .where(eq(users.telegram_id, userId));

  await db.insert(transactions).values({
    user_id: userId,
    type: "purchase",
    amount: cost,
    description,
    created_at: now,
  });

  return { success: true, userBalance: user.balance };
}
