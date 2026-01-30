import { generateEarningsForAllUsers } from "./generate-earnings";
import { processIpnPayment } from "@/services/deposit";
import { info, error } from "@/utils/logger";
import type { NowPaymentsIpnPayload } from "@/types/nowpayments";

/**
 * Validates and returns NowPayments IPN payload
 * @throws Error if payload structure is invalid
 */
function validateIpnPayload(payload: unknown): NowPaymentsIpnPayload {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid IPN payload: expected object");
  }

  const record = payload as Record<string, unknown>;

  // Validate required string fields
  if (typeof record["payment_id"] !== "string") {
    throw new Error("Invalid IPN payload: missing payment_id");
  }
  if (typeof record["payment_status"] !== "string") {
    throw new Error("Invalid IPN payload: missing payment_status");
  }
  if (typeof record["order_id"] !== "string") {
    throw new Error("Invalid IPN payload: missing order_id");
  }

  // Build validated payload with proper type checking
  const validated: NowPaymentsIpnPayload = {
    payment_id: record["payment_id"],
    payment_status: record[
      "payment_status"
    ] as NowPaymentsIpnPayload["payment_status"],
    pay_address:
      typeof record["pay_address"] === "string" ? record["pay_address"] : "",
    price_amount:
      typeof record["price_amount"] === "number" ? record["price_amount"] : 0,
    price_currency:
      typeof record["price_currency"] === "string"
        ? record["price_currency"]
        : "",
    pay_amount:
      typeof record["pay_amount"] === "number" ? record["pay_amount"] : 0,
    actually_paid:
      typeof record["actually_paid"] === "number" ? record["actually_paid"] : 0,
    pay_currency:
      typeof record["pay_currency"] === "string" ? record["pay_currency"] : "",
    order_id: record["order_id"],
    order_description:
      typeof record["order_description"] === "string"
        ? record["order_description"]
        : "",
    purchase_id:
      typeof record["purchase_id"] === "string" ? record["purchase_id"] : "",
    created_at:
      typeof record["created_at"] === "string"
        ? record["created_at"]
        : new Date().toISOString(),
    updated_at:
      typeof record["updated_at"] === "string"
        ? record["updated_at"]
        : new Date().toISOString(),
    outcome_amount:
      typeof record["outcome_amount"] === "number"
        ? record["outcome_amount"]
        : undefined,
    outcome_currency:
      typeof record["outcome_currency"] === "string"
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
    const url = new URL(req.url);

    // Generate earnings endpoint
    if (url.pathname === "/generate-earnings") {
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

    // NOWPayments IPN webhook endpoint
    if (url.pathname === "/webhook/nowpayments" && req.method === "POST") {
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

    return new Response("Not Found", { status: 404 });
  },
});

info("Cron server started", { port: CRON_PORT });
