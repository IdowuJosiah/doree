import "server-only";
import { createServiceClient } from "../supabase/service";
import { notifyAddress, sendEmail, siteUrl } from "./send";
import { customerConfirmation, newOrderAlert, orderShipped, type EmailOrder } from "./templates";

async function loadOrder(orderId: string): Promise<EmailOrder | null> {
  const { data: o, error } = await createServiceClient()
    .from("orders")
    .select("id, number, name, email, address, subtotal, shipping_fee, total, order_items(name, price, quantity)")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !o) {
    console.error("order emails: could not load order", orderId, error);
    return null;
  }
  return {
    id: o.id,
    number: o.number,
    name: o.name,
    email: o.email,
    address: o.address ?? {},
    subtotal: o.subtotal,
    shippingFee: o.shipping_fee,
    total: o.total,
    items: o.order_items ?? [],
  };
}

/** Sends the customer's confirmation and Dorée's new-order alert for a paid order. */
export async function sendOrderEmails(orderId: string) {
  const order = await loadOrder(orderId);
  if (!order) return;
  const url = siteUrl();
  const owner = notifyAddress();
  await Promise.all([
    sendEmail({ to: order.email, email: customerConfirmation(order, url), replyTo: owner || undefined, idempotencyKey: `order-${order.id}-customer` }),
    owner
      ? sendEmail({ to: owner, email: newOrderAlert(order, url), replyTo: order.email, idempotencyKey: `order-${order.id}-owner` })
      : Promise.resolve(false),
  ]);
}

/** Tells the customer their order has been sent. Returns whether it went out. */
export async function sendShippedEmail(orderId: string, message: string) {
  const order = await loadOrder(orderId);
  if (!order) return false;
  return sendEmail({
    to: order.email,
    email: orderShipped(order, siteUrl(), message),
    replyTo: notifyAddress() || undefined,
    idempotencyKey: `order-${order.id}-shipped`,
  });
}
