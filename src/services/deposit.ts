/**
 * Deposit service for managing user deposits
 */

import { db } from "@/db";
import { deposits, users, transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { env } from "@/config/env";
import { error, info } from "@/utils/logger";
import { createNowPaymentsPayment, verifyIpnSignature } from "./nowpayments";
import type { TelegramId, MonopolyCoins, DepositStatus } from "@/types";
import type {
  CreateDepositInput,
  CreateDepositResult,
  SelectDeposit,
} from "@/types/deposit";
import type { NowPaymentsIpnPayload } from "@/types/nowpayments";

const { MINIMUM_DEPOSIT_USD, NOWPAYMENTS_IPN_URL, NOWPAYMENTS_IPN_SECRET } =
  env;

const MC_PER_USD = 1000; // 1 USD = 1,000 MC

/**
 * Calculate MC amount from USD
 */
export function calculateMcAmount(usdAmount: number): MonopolyCoins {
  return Math.floor(usdAmount * MC_PER_USD) as MonopolyCoins;
}

/**
 * Generate unique order ID for deposit
 */
function generateOrderId(userId: TelegramId): string {
  const timestamp = Date.now();
  return `deposit_${userId}_${timestamp}`;
}

/**
 * Create a new deposit
 */
export async function createDeposit(
  input: CreateDepositInput,
): Promise<CreateDepositResult> {
  const { userId, amountUsd } = input;

  try {
    // Validate minimum amount
    if (amountUsd < MINIMUM_DEPOSIT_USD) {
      return {
        success: false,
        error: "minimum_amount",
        minimumAmount: MINIMUM_DEPOSIT_USD,
      };
    }

    // Validate amount is positive
    if (amountUsd <= 0 || !Number.isFinite(amountUsd)) {
      return {
        success: false,
        error: "invalid_amount",
      };
    }

    const amountMc = calculateMcAmount(amountUsd);
    const orderId = generateOrderId(userId);

    // Create payment with NOWPayments
    const paymentResponse = await createNowPaymentsPayment({
      price_amount: amountUsd,
      price_currency: "usd",
      pay_currency: input.payCurrency,
      order_id: orderId,
      ipn_callback_url: `${NOWPAYMENTS_IPN_URL}/webhook/nowpayments`,
      order_description: `Deposit ${amountUsd} USD to Monopoly Bot`,
    });

    // Create deposit record in database
    const [deposit] = await db
      .insert(deposits)
      .values({
        user_id: userId,
        amount_usd: amountUsd,
        amount_mc: amountMc,
        nowpayments_payment_id: paymentResponse.payment_id,
        nowpayments_order_id: orderId,
        status: "pending",
        pay_address: paymentResponse.pay_address,
        pay_amount: Number.parseFloat(paymentResponse.pay_amount),
        pay_currency: paymentResponse.pay_currency,
        payment_url: paymentResponse.payment_url ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    if (!deposit) {
      return {
        success: false,
        error: "database_error",
      };
    }

    info("Deposit created", {
      depositId: deposit.id,
      userId,
      amountUsd,
      amountMc,
      paymentId: paymentResponse.payment_id,
    });

    // Cast to SelectDeposit - validated by database schema and branded type
    const selectDeposit: SelectDeposit = {
      ...deposit,
      id: deposit.id as SelectDeposit["id"],
    };

    return {
      success: true,
      deposit: selectDeposit,
      paymentUrl: paymentResponse.payment_url,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    error("Error creating deposit", {
      userId,
      amountUsd,
      error: errorMessage,
    });

    // Check if error is about minimum amount
    if (
      errorMessage.toLowerCase().includes("less than minimal") ||
      errorMessage.toLowerCase().includes("minimum amount") ||
      errorMessage.toLowerCase().includes("min_amount")
    ) {
      return {
        success: false,
        error: "crypto_minimum_amount",
      };
    }

    // Check if error is about estimate/rate not available
    if (
      errorMessage.toLowerCase().includes("can not get estimate") ||
      errorMessage.toLowerCase().includes("cannot get estimate") ||
      errorMessage.toLowerCase().includes("rate not available") ||
      errorMessage.toLowerCase().includes("exchange rate")
    ) {
      return {
        success: false,
        error: "crypto_estimate_unavailable",
      };
    }

    return {
      success: false,
      error: "api_error",
    };
  }
}

/**
 * Get user deposits
 */
export async function getUserDeposits(
  userId: TelegramId,
  limit = 10,
): Promise<SelectDeposit[]> {
  try {
    const results = await db.query.deposits.findMany({
      where: eq(deposits.user_id, userId),
      orderBy: desc(deposits.created_at),
      limit,
    });

    // Cast results to SelectDeposit - validated by database schema
    return results.map((result) => ({
      ...result,
      id: result.id as SelectDeposit["id"],
    }));
  } catch (err) {
    error("Error fetching user deposits", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

/**
 * Process IPN payment notification
 */
export async function processIpnPayment(
  payload: NowPaymentsIpnPayload,
  signature: string,
  clientIp?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify signature
    const isValid = verifyIpnSignature(
      payload,
      signature,
      NOWPAYMENTS_IPN_SECRET,
    );

    if (!isValid) {
      error("Invalid IPN signature", {
        paymentId: payload.payment_id,
        orderId: payload.order_id,
      });
      return { success: false, error: "invalid_signature" };
    }

    // Find deposit by order ID
    const deposit = await db.query.deposits.findFirst({
      where: eq(deposits.nowpayments_order_id, payload.order_id),
    });

    if (!deposit) {
      error("Deposit not found for IPN", {
        orderId: payload.order_id,
        paymentId: payload.payment_id,
      });
      return { success: false, error: "deposit_not_found" };
    }

    // Check if already processed
    if (deposit.status === "paid") {
      info("Deposit already processed", {
        depositId: deposit.id,
        paymentId: payload.payment_id,
      });
      return { success: true };
    }

    // Check if failed or expired
    if (deposit.status === "failed" || deposit.status === "expired") {
      error("Deposit already failed or expired", {
        depositId: deposit.id,
        status: deposit.status,
      });
      return { success: false, error: "already_processed" };
    }

    // Validate amount matches
    if (Math.abs(deposit.amount_usd - payload.price_amount) > 0.01) {
      error("Amount mismatch in IPN", {
        depositId: deposit.id,
        expectedAmount: deposit.amount_usd,
        receivedAmount: payload.price_amount,
      });
      return { success: false, error: "amount_mismatch" };
    }

    // Validate actually paid amount (prevent partial payment attacks)
    // Allow 5% tolerance for network fees and rounding
    const minExpectedAmount = payload.pay_amount * 0.95;
    if (payload.actually_paid < minExpectedAmount) {
      error("Insufficient payment amount in IPN", {
        depositId: deposit.id,
        expectedAmount: payload.pay_amount,
        actuallyPaid: payload.actually_paid,
        minExpectedAmount,
      });
      return { success: false, error: "insufficient_payment" };
    }

    // Determine new status based on payment status
    let newStatus: DepositStatus;
    if (
      payload.payment_status === "finished" ||
      payload.payment_status === "confirmed"
    ) {
      newStatus = "paid";
    } else if (
      payload.payment_status === "failed" ||
      payload.payment_status === "expired" ||
      payload.payment_status === "refunded"
    ) {
      newStatus =
        payload.payment_status === "failed"
          ? "failed"
          : payload.payment_status === "expired"
            ? "expired"
            : "failed";
    } else {
      // Still pending, don't update yet
      info("Payment still pending", {
        depositId: deposit.id,
        paymentStatus: payload.payment_status,
      });
      return { success: true };
    }

    // Update deposit and credit user balance in transaction
    await db.transaction(async (tx) => {
      // Update deposit status
      await tx
        .update(deposits)
        .set({
          status: newStatus,
          updated_at: new Date(),
          paid_at: newStatus === "paid" ? new Date() : null,
        })
        .where(eq(deposits.id, deposit.id));

      // If paid, credit user balance
      if (newStatus === "paid") {
        await tx
          .update(users)
          .set({
            balance: deposit.amount_mc,
            updated_at: new Date(),
          })
          .where(eq(users.telegram_id, deposit.user_id));

        // Create transaction record
        await tx.insert(transactions).values({
          user_id: deposit.user_id,
          type: "deposit",
          amount: deposit.amount_mc,
          description: `Deposit: ${deposit.amount_usd} USD = ${deposit.amount_mc} MC`,
          metadata: {
            deposit_id: deposit.id,
            payment_id: payload.payment_id,
            order_id: payload.order_id,
            pay_currency: payload.pay_currency,
            pay_amount: payload.pay_amount,
          },
          created_at: new Date(),
        });
      }
    });

    info("Deposit processed via IPN", {
      depositId: deposit.id,
      userId: deposit.user_id,
      status: newStatus,
      amountUsd: deposit.amount_usd,
      amountMc: deposit.amount_mc,
      clientIp,
    });

    return { success: true };
  } catch (err) {
    error("Error processing IPN payment", {
      paymentId: payload.payment_id,
      orderId: payload.order_id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { success: false, error: "database_error" };
  }
}

/**
 * Get status display name for a given language
 */
export function getDepositStatusDisplay(
  status: DepositStatus,
  language: string,
): string {
  const statusMap: Record<DepositStatus, Record<string, string>> = {
    pending: {
      en: "Pending",
      es: "Pendiente",
      ru: "В ожидании",
      pt: "Pendente",
    },
    paid: {
      en: "Paid",
      es: "Pagado",
      ru: "Оплачено",
      pt: "Pago",
    },
    failed: {
      en: "Failed",
      es: "Fallido",
      ru: "Не удалось",
      pt: "Falhou",
    },
    expired: {
      en: "Expired",
      es: "Expirado",
      ru: "Истекший",
      pt: "Expirado",
    },
  };

  return statusMap[status]?.[language] ?? status;
}
