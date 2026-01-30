/**
 * Types for NOWPayments API integration
 */

/**
 * Request body for creating a payment
 */
export interface NowPaymentsCreatePaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency?: string;
  pay_amount?: number;
  ipn_callback_url: string;
  order_id: string;
  order_description?: string;
  purchase_id?: string;
  payout_address?: string;
  payout_currency?: string;
  payout_extra_id?: string;
  fixed_rate?: boolean;
  case?: string; // For sandbox testing
}

/**
 * Response from creating a payment
 */
export interface NowPaymentsCreatePaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  pay_amount: string;
  pay_currency: string;
  price_amount: string;
  price_currency: string;
  payment_url?: string;
  order_id: string;
  order_description: string;
  created_at: string;
  updated_at: string;
  purchase_id: string;
}

/**
 * IPN (Instant Payment Notification) payload
 */
export interface NowPaymentsIpnPayload {
  payment_id: string;
  payment_status:
    | "waiting"
    | "confirming"
    | "confirmed"
    | "sending"
    | "partially_paid"
    | "finished"
    | "failed"
    | "refunded"
    | "expired";
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount?: number;
  outcome_currency?: string;
}
