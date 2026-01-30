/**
 * NOWPayments API client service
 */

import { env } from "@/config/env";
import { error, info } from "@/utils/logger";
import type {
  NowPaymentsCreatePaymentRequest,
  NowPaymentsCreatePaymentResponse,
  NowPaymentsIpnPayload,
} from "@/types/nowpayments";

/**
 * Validates the payment response from NOWPayments API
 * @throws Error if response structure is invalid
 */
function validatePaymentResponse(
  data: unknown,
): NowPaymentsCreatePaymentResponse {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid response: expected object");
  }

  const record = data as Record<string, unknown>;

  // Validate required fields
  if (typeof record["payment_id"] !== "string") {
    throw new Error("Invalid response: missing or invalid payment_id");
  }
  if (typeof record["payment_status"] !== "string") {
    throw new Error("Invalid response: missing or invalid payment_status");
  }
  if (typeof record["order_id"] !== "string") {
    throw new Error("Invalid response: missing or invalid order_id");
  }

  // Build validated response object
  const validated: NowPaymentsCreatePaymentResponse = {
    payment_id: record["payment_id"],
    payment_status: record["payment_status"],
    pay_address:
      typeof record["pay_address"] === "string" ? record["pay_address"] : "",
    pay_amount:
      typeof record["pay_amount"] === "string" ? record["pay_amount"] : "0",
    pay_currency:
      typeof record["pay_currency"] === "string" ? record["pay_currency"] : "",
    price_amount:
      typeof record["price_amount"] === "string" ? record["price_amount"] : "0",
    price_currency:
      typeof record["price_currency"] === "string"
        ? record["price_currency"]
        : "",
    payment_url:
      typeof record["payment_url"] === "string"
        ? record["payment_url"]
        : undefined,
    order_id: record["order_id"],
    order_description:
      typeof record["order_description"] === "string"
        ? record["order_description"]
        : "",
    created_at:
      typeof record["created_at"] === "string"
        ? record["created_at"]
        : new Date().toISOString(),
    updated_at:
      typeof record["updated_at"] === "string"
        ? record["updated_at"]
        : new Date().toISOString(),
    purchase_id:
      typeof record["purchase_id"] === "string" ? record["purchase_id"] : "",
  };

  return validated;
}

const { NOWPAYMENTS_API_KEY, NOWPAYMENTS_API_URL } = env;

/**
 * Create a new payment with NOWPayments
 */
export async function createNowPaymentsPayment(
  request: NowPaymentsCreatePaymentRequest,
): Promise<NowPaymentsCreatePaymentResponse> {
  const url = `${NOWPAYMENTS_API_URL}/payment`;

  info("Creating NOWPayments payment", {
    orderId: request.order_id,
    amount: request.price_amount,
    currency: request.price_currency,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": NOWPAYMENTS_API_KEY,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage =
      typeof errorData === "object" &&
      errorData !== null &&
      "message" in errorData &&
      typeof errorData.message === "string"
        ? errorData.message
        : response.statusText;
    error("NOWPayments API error", {
      status: response.status,
      message: errorMessage,
      orderId: request.order_id,
    });
    throw new Error(`NOWPayments API error: ${errorMessage}`);
  }

  const rawData = await response.json();
  const data = validatePaymentResponse(rawData);

  info("NOWPayments payment created", {
    paymentId: data.payment_id,
    orderId: data.order_id,
    status: data.payment_status,
  });

  return data;
}

/**
 * Recursively sort object keys alphabetically
 * Required for proper IPN signature verification
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();

  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }

  return sorted;
}

/**
 * Verify IPN signature using HMAC-SHA512
 * Follows NOWPayments official documentation:
 * - Sort keys alphabetically (recursively for nested objects)
 * - Use JSON.stringify without spaces (compact format)
 * - Sign with IPN secret using HMAC-SHA512
 */
export function verifyIpnSignature(
  payload: NowPaymentsIpnPayload,
  signature: string,
  secret: string,
): boolean {
  try {
    // Recursively sort keys alphabetically
    const sortedPayload = sortObjectKeys(payload);

    // Stringify without spaces (compact JSON format)
    const payloadString = JSON.stringify(sortedPayload);

    // Create HMAC-SHA512
    const hmac = new Bun.CryptoHasher("sha512", secret);
    hmac.update(payloadString);
    const calculatedSignature = hmac.digest("hex");

    // Compare signatures (timing-safe comparison)
    if (calculatedSignature.length !== signature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < calculatedSignature.length; i++) {
      result |= calculatedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
    }

    return result === 0;
  } catch (err) {
    error("Error verifying IPN signature", {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
