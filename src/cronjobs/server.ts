import { generateEarningsForAllUsers } from "./generate-earnings";
import { processIpnPayment, checkAllPendingDeposits } from "@/services/deposit";
import { info, error, warn } from "@/utils/logger";
import {
  isObject,
  isString,
  isNumber,
  isNowPaymentsStatus,
} from "@/utils/nowpayments-validation";
import type { NowPaymentsIpnPayload } from "@/types/nowpayments";
import { Telegraf } from "telegraf";
import config from "@/config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getText } from "@/i18n";
import { DEFAULT_LANGUAGE } from "@/constants";

/**
 * Validates and returns NowPayments IPN payload
 * @throws Error if payload structure is invalid
 */
function validateIpnPayload(payload: unknown): NowPaymentsIpnPayload {
  if (!isObject(payload)) {
    throw new Error("Invalid IPN payload: expected object");
  }

  const record = payload;

  // Validate required string fields
  if (!isString(record["payment_id"])) {
    throw new Error("Invalid IPN payload: missing payment_id");
  }
  if (!isString(record["payment_status"])) {
    throw new Error("Invalid IPN payload: missing payment_status");
  }
  if (!isNowPaymentsStatus(record["payment_status"])) {
    throw new Error("Invalid IPN payload: invalid payment_status");
  }
  if (!isString(record["order_id"])) {
    throw new Error("Invalid IPN payload: missing order_id");
  }

  // Build validated payload with proper type checking
  const validated: NowPaymentsIpnPayload = {
    payment_id: record["payment_id"],
    payment_status: record["payment_status"],
    pay_address: isString(record["pay_address"]) ? record["pay_address"] : "",
    price_amount: isNumber(record["price_amount"]) ? record["price_amount"] : 0,
    price_currency: isString(record["price_currency"])
      ? record["price_currency"]
      : "",
    pay_amount: isNumber(record["pay_amount"]) ? record["pay_amount"] : 0,
    actually_paid: isNumber(record["actually_paid"])
      ? record["actually_paid"]
      : 0,
    pay_currency: isString(record["pay_currency"])
      ? record["pay_currency"]
      : "",
    order_id: record["order_id"],
    order_description: isString(record["order_description"])
      ? record["order_description"]
      : "",
    purchase_id: isString(record["purchase_id"]) ? record["purchase_id"] : "",
    created_at: isString(record["created_at"])
      ? record["created_at"]
      : new Date().toISOString(),
    updated_at: isString(record["updated_at"])
      ? record["updated_at"]
      : new Date().toISOString(),
    outcome_amount: isNumber(record["outcome_amount"])
      ? record["outcome_amount"]
      : undefined,
    outcome_currency: isString(record["outcome_currency"])
      ? record["outcome_currency"]
      : undefined,
  };

  return validated;
}

const CRON_SECRET = process.env["CRON_SECRET"] || "default-secret";
const CRON_PORT = Number.parseInt(process.env["CRON_PORT"] || "3001", 10);

async function sendRentReminders(telegram: Telegraf["telegram"]): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const allUsers = await db.select().from(users);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of allUsers) {
    if (user.rent_reminder_enabled !== true) {
      skipped++;
      continue;
    }

    if (
      user.last_rent_reminder_at &&
      user.last_rent_reminder_at.getTime() > twentyFourHoursAgo.getTime()
    ) {
      skipped++;
      continue;
    }

    const userProps = await db.query.userProperties.findMany({
      where: (fields, { eq }) => eq(fields.user_id, user.telegram_id),
    });

    const totalAccumulated = userProps.reduce(
      (sum, p) => sum + p.accumulated_unclaimed,
      0,
    );

    if (totalAccumulated <= 0) {
      skipped++;
      continue;
    }

    try {
      const language = user.language ?? DEFAULT_LANGUAGE;
      const message = getText(language, "rent_reminder_message").replace(
        "{amount}",
        totalAccumulated.toFixed(2),
      );

      await telegram.sendMessage(user.telegram_id, message, {
        parse_mode: "Markdown",
      });

      await db
        .update(users)
        .set({ last_rent_reminder_at: now })
        .where(eq(users.telegram_id, user.telegram_id));

      sent++;
    } catch (err) {
      warn("Failed to send rent reminder", {
        userId: user.telegram_id,
        error: err instanceof Error ? err.message : String(err),
      });
      failed++;
    }
  }

  return { sent, failed, skipped };
}

Bun.serve({
  port: CRON_PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    const { method } = req;

    const headersObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersObj[key] = value;
    });

    let bodyContent: unknown;
    if (method !== "GET" && method !== "HEAD") {
      const clonedReq = req.clone();
      try {
        bodyContent = await clonedReq.json();
      } catch {
        bodyContent = await clonedReq.text();
      }
    } else {
      bodyContent = undefined;
    }

    info("Incoming request", {
      method,
      path: pathname,
      headers: headersObj,
      body: bodyContent,
    });

    // Generate earnings endpoint
    if (pathname === "/generate-earnings") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        error("Unauthorized cron job request", {
          authHeaderReceived: authHeader ? "exists" : "none",
        });
        return new Response("Unauthorized", { status: 401 });
      }

      generateEarningsForAllUsers()
        .then(() => info("Earnings generated successfully"))
        .catch((err) => error("Error generating earnings", { error: err }));

      return new Response("OK", { status: 200 });
    }

    // Send rent reminders endpoint
    if (pathname === "/send-rent-reminders") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        error("Unauthorized rent reminder request", {
          authHeaderReceived: authHeader ? "exists" : "none",
        });
        return new Response("Unauthorized", { status: 401 });
      }

      info("Starting rent reminders cronjob");

      try {
        const bot = new Telegraf(config.botToken);
        const result = await sendRentReminders(bot.telegram);
        info("Rent reminders completed", result);
        return new Response(JSON.stringify({ success: true, ...result }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        error("Error in rent reminders cronjob", {
          error: err instanceof Error ? err.message : String(err),
        });
        return new Response(
          JSON.stringify({ success: false, error: "internal_error" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Check payment statuses endpoint (for cronjob)
    if (pathname === "/check-payment-statuses") {
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        error("Unauthorized payment status check request", {
          authHeaderReceived: authHeader ? "exists" : "none",
        });
        return new Response("Unauthorized", { status: 401 });
      }

      info("Starting payment status check cronjob");

      try {
        const bot = new Telegraf(config.botToken);
        const processedCount = await checkAllPendingDeposits(bot.telegram);
        info("Payment status check completed", { processedCount });
        return new Response(JSON.stringify({ success: true, processedCount }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        error("Error in payment status check cronjob", {
          error: err instanceof Error ? err.message : String(err),
        });
        return new Response(
          JSON.stringify({ success: false, error: "internal_error" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // NOWPayments IPN webhook endpoint
    if (pathname === "/webhook/nowpayments" && req.method === "POST") {
      try {
        const signature = req.headers.get("x-nowpayments-sig");

        if (!signature) {
          error("Missing IPN signature");
          return new Response("Missing signature", { status: 400 });
        }

        // Log client IP for audit trail
        const clientIp =
          req.headers.get("x-forwarded-for") ||
          req.headers.get("x-real-ip") ||
          "unknown";

        const rawPayload = await req.json();

        // Validate payload has required fields for NowPaymentsIpnPayload
        let payload: NowPaymentsIpnPayload;
        try {
          payload = validateIpnPayload(rawPayload);
        } catch (validationError) {
          error("Invalid IPN payload structure", {
            error:
              validationError instanceof Error
                ? validationError.message
                : String(validationError),
            clientIp,
          });
          return new Response("Invalid payload", { status: 400 });
        }

        info("Received NOWPayments IPN", {
          paymentId: payload.payment_id,
          orderId: payload.order_id,
          status: payload.payment_status,
          clientIp,
        });

        const result = await processIpnPayment(payload, signature, clientIp);

        if (result.success) {
          info("IPN processed successfully", {
            paymentId: payload.payment_id,
            orderId: payload.order_id,
          });
          return new Response("OK", { status: 200 });
        } else {
          error("IPN processing failed", {
            paymentId: payload.payment_id,
            error: result.error,
          });
          return new Response(`Error: ${result.error}`, { status: 400 });
        }
      } catch (err) {
        error("Error processing IPN webhook", {
          error: err instanceof Error ? err.message : String(err),
        });
        return new Response("Internal Server Error", { status: 500 });
      }
    }

    info("Route not found", {
      method: req.method,
      path: pathname,
    });

    return new Response("Not Found", { status: 404 });
  },
});

info("Cron server started", { port: CRON_PORT });
