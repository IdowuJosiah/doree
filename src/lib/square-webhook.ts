import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Square signs `notificationUrl + rawBody` with HMAC-SHA256 and sends the
 * base64 digest in the x-square-hmacsha256-signature header.
 */
export function verifySquareSignature(rawBody: string, signature: string | null, signatureKey: string, notificationUrl: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", signatureKey).update(notificationUrl + rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type SquarePaymentEvent = {
  type?: string;
  data?: {
    object?: {
      payment?: {
        id?: string;
        status?: string;
        reference_id?: string;
        amount_money?: { amount?: number; currency?: string };
      };
    };
  };
};

export type OrderRecord = { id: string; status: string; total: number };

export type WebhookDeps = {
  currency: string;
  findOrder: (orderId: string) => Promise<OrderRecord | null>;
  /** Atomically marks paid and reduces stock; false when the order was not pending. */
  markPaid: (orderId: string, paymentId: string) => Promise<boolean>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type WebhookResult = "ignored" | "paid" | "already_processed" | "amount_mismatch" | "unknown_order";

/**
 * Only a COMPLETED payment changes anything. Failed, cancelled and abandoned
 * payments leave the order pending and stock untouched.
 */
export async function handlePaymentEvent(event: SquarePaymentEvent, deps: WebhookDeps): Promise<WebhookResult> {
  if (event.type !== "payment.updated" && event.type !== "payment.created") return "ignored";
  const payment = event.data?.object?.payment;
  if (!payment?.id || payment.status !== "COMPLETED" || !payment.reference_id) return "ignored";

  // Payments from other sources carry unrelated reference ids.
  if (!UUID.test(payment.reference_id)) return "ignored";

  const order = await deps.findOrder(payment.reference_id);
  if (!order) return "unknown_order";
  if (payment.amount_money?.amount !== order.total || payment.amount_money?.currency !== deps.currency) return "amount_mismatch";

  return (await deps.markPaid(order.id, payment.id)) ? "paid" : "already_processed";
}
