import { generateEarningsForAllUsers } from "./generate-earnings";
import { processIpnPayment, checkAllPendingDeposits } from "@/services/deposit";
import { info, error } from "@/utils/logger";
import type {
  NowPaymentsIpnPayload,
  NowPaymentsStatus,
} from "@/types/nowpayments";

/**
 * Type guard for checking if a value is a valid object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Type guard for checking if a value is a valid string
 */
function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard for checking if a value is a valid number
 */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Type guard for checking if a value is a valid NowPaymentsStatus
 */
function isNowPaymentsStatus(value: unknown): value is NowPaymentsStatus {
  if (!isString(value)) return false;
  const validStatuses = [
    "waiting",
    "confirming",
    "confirmed",
    "sending",
    "partially_paid",
    "finished",
    "failed",
    "refunded",
    "expired",
  ];
  return validStatuses.includes(value);
}

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
        const processedCount = await checkAllPendingDeposits();
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
