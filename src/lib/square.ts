import "server-only";
import { createHash } from "node:crypto";
import { siteConfig } from "./config";

const baseUrl = () =>
  process.env.SQUARE_ENVIRONMENT === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";

export type SquarePayment = { id: string; status: string };

// Charges the card token from the Square Web Payments SDK. The amount always
// comes from the order row in the database.
export async function createSquarePayment(args: {
  sourceId: string;
  orderId: string;
  orderNumber: number;
  amountCents: number;
  buyerEmail: string;
}): Promise<SquarePayment> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) throw new Error("Square is not configured");

  // Card tokens are single use, so each attempt gets its own idempotency key.
  const attempt = createHash("sha256").update(args.sourceId).digest("hex").slice(0, 8);

  const res = await fetch(`${baseUrl()}/v2/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "Square-Version": "2024-10-17" },
    body: JSON.stringify({
      idempotency_key: `${args.orderId}-${attempt}`,
      source_id: args.sourceId,
      amount_money: { amount: args.amountCents, currency: siteConfig.currency },
      reference_id: args.orderId,
      location_id: locationId,
      buyer_email_address: args.buyerEmail,
      note: `${siteConfig.name} order #${args.orderNumber}`,
      autocomplete: true,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.payment) {
    const detail = json.errors?.[0]?.detail ?? "Payment failed";
    throw new Error(detail);
  }
  return { id: json.payment.id, status: json.payment.status };
}
