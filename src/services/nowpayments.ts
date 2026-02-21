/**
 * NOWPayments API client service
 */

import { env } from "@/config/env";
import { error, info } from "@/utils/logger";
import type {
  NowPaymentsCreatePaymentRequest,
  NowPaymentsCreatePaymentResponse,
  NowPaymentsIpnPayload,
  NowPaymentsPaymentStatus,
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
function isNowPaymentsStatus(
  value: unknown,
): value is import("@/types/nowpayments").NowPaymentsStatus {
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
 * Validates the payment response from NOWPayments API
 * @throws Error if response structure is invalid
 */
function validatePaymentResponse(
  data: unknown,
): import("@/types/nowpayments").NowPaymentsCreatePaymentResponse {
  if (!isObject(data)) {
    throw new Error("Invalid response: expected object");
  }

  const record = data;

  // Validate required fields
  if (!isString(record["payment_id"])) {
    throw new Error("Invalid response: missing or invalid payment_id");
  }
  if (!isString(record["payment_status"])) {
    throw new Error("Invalid response: missing or invalid payment_status");
  }
  if (!isString(record["order_id"])) {
    throw new Error("Invalid response: missing or invalid order_id");
  }

  // Build validated response object
  const validated: import("@/types/nowpayments").NowPaymentsCreatePaymentResponse =
    {
      payment_id: record["payment_id"],
      payment_status: record["payment_status"],
      pay_address: isString(record["pay_address"]) ? record["pay_address"] : "",
      pay_amount: isString(record["pay_amount"])
        ? record["pay_amount"]
        : isNumber(record["pay_amount"])
          ? String(record["pay_amount"])
          : "0",
      pay_currency: isString(record["pay_currency"])
        ? record["pay_currency"]
        : "",
      price_amount: isString(record["price_amount"])
        ? record["price_amount"]
        : "0",
      price_currency: isString(record["price_currency"])
        ? record["price_currency"]
        : "",
      payment_url: isString(record["payment_url"])
        ? record["payment_url"]
        : undefined,
      order_id: record["order_id"],
      order_description: isString(record["order_description"])
        ? record["order_description"]
        : "",
      created_at: isString(record["created_at"])
        ? record["created_at"]
        : new Date().toISOString(),
      updated_at: isString(record["updated_at"])
        ? record["updated_at"]
        : new Date().toISOString(),
      purchase_id: isString(record["purchase_id"]) ? record["purchase_id"] : "",
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
 * Validate payment status response from NOWPayments API
 */
function validatePaymentStatusResponse(
  data: unknown,
): import("@/types/nowpayments").NowPaymentsPaymentStatus {
  if (!isObject(data)) {
    throw new Error("Invalid payment status response: expected object");
  }

  const record = data;

  if (!isString(record["payment_id"]) && !isNumber(record["payment_id"])) {
    throw new Error("Invalid response: missing or invalid payment_id");
  }
  if (!isNowPaymentsStatus(record["payment_status"])) {
    throw new Error("Invalid response: missing or invalid payment_status");
  }
  if (!isString(record["order_id"])) {
    throw new Error("Invalid response: missing or invalid order_id");
  }

  const validated: import("@/types/nowpayments").NowPaymentsPaymentStatus = {
    payment_id: isNumber(record["payment_id"])
      ? record["payment_id"]
      : Number.parseInt(record["payment_id"] as string, 10),
    created_at: isString(record["created_at"])
      ? record["created_at"]
      : new Date().toISOString(),
    amount_to_pay: isNumber(record["amount_to_pay"])
      ? record["amount_to_pay"]
      : 0,
    currency_to: isString(record["currency_to"]) ? record["currency_to"] : "",
    currency_from: isString(record["currency_from"])
      ? record["currency_from"]
      : "",
    address: isString(record["address"]) ? record["address"] : "",
    order_id: record["order_id"],
    order_description: isString(record["order_description"])
      ? record["order_description"]
      : "",
    success_url: isString(record["success_url"]) ? record["success_url"] : null,
    status: record["payment_status"],
  };

  return validated;
}

/**
 * Get payment status from NOWPayments API
 */
export async function getPaymentStatus(
  paymentId: string,
): Promise<NowPaymentsPaymentStatus> {
  const url = `${NOWPAYMENTS_API_URL}/payment/${paymentId}`;

  info("Fetching payment status from NOWPayments", { paymentId });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": NOWPAYMENTS_API_KEY,
    },
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
    error("NOWPayments API error fetching payment status", {
      status: response.status,
      message: errorMessage,
      paymentId,
    });
    throw new Error(`NOWPayments API error: ${errorMessage}`);
  }

  const rawData = await response.json();
  const data = validatePaymentStatusResponse(rawData);

  info("Payment status fetched", {
    paymentId: data.payment_id,
    status: data.status,
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
