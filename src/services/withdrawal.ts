import { db } from "@/db";
import { withdrawals, users, transactions } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type {
  TelegramId,
  MonopolyCoins,
  WithdrawalCurrency,
  WithdrawalStatus,
  WithdrawalId,
  SelectWithdrawal,
} from "@/types";
import { env } from "@/config/env";
import { error, info } from "@/utils/logger";

export interface CreateWithdrawalInput {
  userId: TelegramId;
  amount: MonopolyCoins;
  currency: WithdrawalCurrency;
  walletAddress: string;
}

export interface WithdrawalResult {
  success: boolean;
  error?:
    | "insufficient_balance"
    | "minimum_amount"
    | "pending_withdrawal"
    | "cooldown_active"
    | "database_error";
  withdrawal?: SelectWithdrawal;
  needed?: MonopolyCoins;
}

const { MINIMUM_WITHDRAWAL_MC, WITHDRAWAL_COOLDOWN_DAYS } = env;

export async function createWithdrawal(
  input: CreateWithdrawalInput,
): Promise<WithdrawalResult> {
  const { userId, amount, currency, walletAddress } = input;

  try {
    // Check minimum amount
    if (amount < MINIMUM_WITHDRAWAL_MC) {
      return {
        success: false,
        error: "minimum_amount",
        needed: MINIMUM_WITHDRAWAL_MC as MonopolyCoins,
      };
    }

    // Check user balance
    const user = await db.query.users.findFirst({
      where: eq(users.telegram_id, userId),
    });

    if (!user) {
      return { success: false, error: "database_error" };
    }

    const { balance: userBalance } = user;
    if (userBalance < amount) {
      return {
        success: false,
        error: "insufficient_balance",
        needed: (amount - userBalance) as MonopolyCoins,
      };
    }

    // Check for pending withdrawal
    const pendingWithdrawal = await db.query.withdrawals.findFirst({
      where: and(
        eq(withdrawals.user_id, userId),
        eq(withdrawals.status, "pending"),
      ),
    });

    if (pendingWithdrawal) {
      return { success: false, error: "pending_withdrawal" };
    }

    // Check cooldown
    const lastWithdrawal = await db.query.withdrawals.findFirst({
      where: eq(withdrawals.user_id, userId),
      orderBy: desc(withdrawals.created_at),
    });

    if (lastWithdrawal) {
      const cooldownEnd = new Date(lastWithdrawal.created_at);
      cooldownEnd.setDate(cooldownEnd.getDate() + WITHDRAWAL_COOLDOWN_DAYS);

      if (new Date() < cooldownEnd) {
        return { success: false, error: "cooldown_active" };
      }
    }

    // Create withdrawal and deduct balance in transaction
    const result = await db.transaction(async (tx) => {
      // Deduct balance
      await tx
        .update(users)
        .set({
          balance: sql`${users.balance} - ${amount}`,
          updated_at: new Date(),
        })
        .where(eq(users.telegram_id, userId));

      // Create withdrawal record
      const [withdrawal] = await tx
        .insert(withdrawals)
        .values({
          user_id: userId,
          amount,
          currency,
          wallet_address: walletAddress,
          status: "pending" as WithdrawalStatus,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();

      return withdrawal;
    });

    if (!result) {
      return { success: false, error: "database_error" };
    }

    info("Withdrawal created", {
      withdrawalId: result.id,
      userId,
      amount,
      currency,
    });

    return {
      success: true,
      withdrawal: result satisfies typeof result as SelectWithdrawal,
    };
  } catch (err) {
    error("Error creating withdrawal", {
      userId,
      amount,
      currency,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "database_error" };
  }
}

export async function getUserWithdrawals(
  userId: TelegramId,
  limit = 10,
): Promise<SelectWithdrawal[]> {
  try {
    const results = await db.query.withdrawals.findMany({
      where: eq(withdrawals.user_id, userId),
      orderBy: desc(withdrawals.created_at),
      limit,
    });

    return results as SelectWithdrawal[];
  } catch (err) {
    error("Error fetching user withdrawals", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export async function getWithdrawalById(
  withdrawalId: WithdrawalId,
): Promise<SelectWithdrawal | null> {
  try {
    const result = await db.query.withdrawals.findFirst({
      where: eq(withdrawals.id, withdrawalId),
    });

    return result ? (result as SelectWithdrawal) : null;
  } catch (err) {
    error("Error fetching withdrawal by id", {
      withdrawalId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export interface ProcessWithdrawalInput {
  withdrawalId: WithdrawalId;
  adminId: TelegramId;
  transactionHash: string;
}

export async function processWithdrawal(
  input: ProcessWithdrawalInput,
): Promise<{ success: boolean; error?: string }> {
  const { withdrawalId, adminId, transactionHash } = input;

  try {
    const withdrawal = await getWithdrawalById(withdrawalId);

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" };
    }

    if (withdrawal.status !== "pending") {
      return { success: false, error: "Withdrawal is not pending" };
    }

    await db
      .update(withdrawals)
      .set({
        status: "processed" as WithdrawalStatus,
        transaction_hash: transactionHash,
        processed_by: adminId,
        processed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(withdrawals.id, withdrawalId));

    info("Withdrawal processed", {
      withdrawalId,
      adminId,
      transactionHash,
    });

    return { success: true };
  } catch (err) {
    error("Error processing withdrawal", {
      withdrawalId,
      adminId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "Database error" };
  }
}

export interface CancelWithdrawalInput {
  withdrawalId: WithdrawalId;
  refund?: boolean;
}

export async function cancelWithdrawal(
  input: CancelWithdrawalInput,
): Promise<{ success: boolean; error?: string }> {
  const { withdrawalId, refund = false } = input;

  try {
    const withdrawal = await getWithdrawalById(withdrawalId);

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" };
    }

    if (withdrawal.status !== "pending") {
      return { success: false, error: "Withdrawal is not pending" };
    }

    await db.transaction(async (tx) => {
      if (refund) {
        // Refund the amount to user
        await tx
          .update(users)
          .set({
            balance: sql`${users.balance} + ${withdrawal.amount}`,
            updated_at: new Date(),
          })
          .where(eq(users.telegram_id, withdrawal.user_id));

        // Create refund transaction
        await tx.insert(transactions).values({
          user_id: withdrawal.user_id,
          type: "withdrawal_refund",
          amount: withdrawal.amount,
          description: `Withdrawal refunded: ${withdrawal.amount} MC`,
          metadata: {
            withdrawal_id: withdrawalId,
          },
          created_at: new Date(),
        });
      }

      await tx
        .update(withdrawals)
        .set({
          status: refund
            ? ("refunded" as WithdrawalStatus)
            : ("cancelled" as WithdrawalStatus),
          updated_at: new Date(),
        })
        .where(eq(withdrawals.id, withdrawalId));
    });

    info("Withdrawal cancelled", {
      withdrawalId,
      refund,
    });

    return { success: true };
  } catch (err) {
    error("Error cancelling withdrawal", {
      withdrawalId,
      refund,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "Database error" };
  }
}

const CURRENCY_DISPLAY_NAMES: Record<WithdrawalCurrency, string> = {
  bitcoin: "Bitcoin (BTC)",
  usdt_tron: "USDT (TRON)",
  monero: "Monero (XMR)",
};

export function getCurrencyDisplayName(currency: WithdrawalCurrency): string {
  return CURRENCY_DISPLAY_NAMES[currency] ?? currency;
}

export function calculateUsdAmount(mcAmount: MonopolyCoins): number {
  // 1 USD = 1,000 MC
  return mcAmount / 1000;
}
