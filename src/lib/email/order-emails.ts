import "server-only";
import { createServiceClient } from "../supabase/service";
import { notifyAddress, sendEmail, siteUrl } from "./send";
import { customerConfirmation, newOrderAlert, type EmailOrder } from "./templates";

/** Sends the customer's confirmation and Dorée's new-order alert for a paid order. */
export async function sendOrderEmails(orderId: string) {
  const { data: o, error } = await createServiceClient()
    .from("orders")
    .select("id, number, name, email, address, subtotal, shipping_fee, total, order_items(name, price, quantity)")
    .eq("id", orderId)
    .maybeSingle();
  if (error || !o) {
    console.error("order emails: could not load order", orderId, error);
    return;
  }
  const order: EmailOrder = {
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
  const url = siteUrl();
  const owner = notifyAddress();
  await Promise.all([
    sendEmail({ to: order.email, email: customerConfirmation(order, url), replyTo: owner || undefined, idempotencyKey: `order-${order.id}-customer` }),
    owner
      ? sendEmail({ to: owner, email: newOrderAlert(order, url), replyTo: order.email, idempotencyKey: `order-${order.id}-owner` })
      : Promise.resolve(false),
  ]);
}
