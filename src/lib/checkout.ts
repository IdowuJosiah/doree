import "server-only";
import { z } from "zod";
import { CheckoutError, pickupAllowed, priceOrder, zip5, type DiscountRecord, type VariantRecord } from "./pricing";
import { toShippingSettings, type ShippingRow } from "./data/site";
import { createServiceClient } from "./supabase/service";
import { isUsState } from "./us-states";

// Note what is absent: there is no price, total or shipping fee in the input.
export const checkoutSchema = z.object({
  items: z
    .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(50),
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(1).max(120),
  fulfillment: z.enum(["ship", "pickup"]).default("ship"),
  // Local pickup needs only the ZIP code (to check the pickup area).
  address: z.object({
    line1: z.string().trim().max(200).default(""),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().max(100).default(""),
    state: z.string().trim().toUpperCase().default(""),
    postalCode: z.string().trim().min(3).max(12),
  }),
  discountCode: z.string().trim().toUpperCase().max(40).optional(),
}).superRefine((v, ctx) => {
  if (v.fulfillment === "pickup") return;
  if (!v.address.line1) ctx.addIssue({ code: "custom", path: ["address", "line1"], message: "Enter your address" });
  if (!v.address.city) ctx.addIssue({ code: "custom", path: ["address", "city"], message: "Enter your city" });
  if (!isUsState(v.address.state)) ctx.addIssue({ code: "custom", path: ["address", "state"], message: "Choose a valid state" });
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

type VariantQueryRow = Omit<VariantRecord, "product"> & { products: VariantRecord["product"] | null };

// Recalculates every price and the shipping fee from the database, then
// creates the order as `pending`. Nothing is charged and no stock changes here.
export async function createPendingOrder(input: CheckoutInput, customerId: string | null) {
  const db = createServiceClient();

  const { data: rows, error } = await db
    .from("product_variants")
    .select("id, label, stock, products(id, name, price, published, archived, sold_out)")
    .in("id", input.items.map((i) => i.variantId))
    .returns<VariantQueryRow[]>();
  if (error) throw error;

  const variants: VariantRecord[] = (rows ?? []).flatMap((r) => (r.products ? [{ ...r, product: r.products }] : []));

  const { data: shippingRow, error: shippingError } = await db
    .from("shipping_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle<ShippingRow>();
  if (shippingError) throw shippingError;
  const shipping = toShippingSettings(shippingRow);

  const pickup = input.fulfillment === "pickup";
  if (pickup && !pickupAllowed(input.address.postalCode, shipping)) {
    throw new CheckoutError(
      shipping.pickupEnabled
        ? `Local pickup is only for ZIP codes ${shipping.pickupZips.join(", ")}. Choose shipping, or contact us if you are nearby.`
        : "Local pickup is not available right now. Please choose shipping.",
    );
  }
  // Pickup orders are in Texas; only the ZIP code is kept as their address.
  const address = pickup ? { postalCode: zip5(input.address.postalCode), state: "TX" } : input.address;

  // undefined = no code entered; null = entered but not found.
  let discount: DiscountRecord | null | undefined;
  if (input.discountCode) {
    const { data: code, error: codeError } = await db
      .from("discount_codes")
      .select("code, percent, active, starts_at, ends_at, max_uses, uses, min_subtotal")
      .eq("code", input.discountCode)
      .maybeSingle<DiscountRecord>();
    // Before the discounts migration is run the table does not exist.
    if (codeError) throw new CheckoutError("Discount codes can't be used right now. Remove the code to continue.");
    discount = code;
  }

  const priced = priceOrder(input.items, variants, address.state, shipping, discount, pickup);

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      customer_id: customerId,
      email: input.email,
      name: input.name,
      address,
      state: address.state,
      // Only sent for pickup, so shipping keeps working before migration 0011.
      ...(pickup ? { fulfillment: "pickup" } : {}),
      subtotal: priced.subtotal,
      // Only sent when a code was used, so checkout keeps working before the
      // discounts migration has added these columns.
      ...(priced.discount > 0 || priced.discountCode ? { discount_code: priced.discountCode, discount_amount: priced.discount } : {}),
      shipping_fee: priced.shippingFee,
      total: priced.total,
      status: "pending",
    })
    .select("id, number")
    .single();
  if (orderError) throw orderError;

  const { error: itemsError } = await db.from("order_items").insert(
    priced.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      name: l.name,
      price: l.price,
      quantity: l.quantity,
    })),
  );
  if (itemsError) {
    await db.from("orders").delete().eq("id", order.id);
    throw itemsError;
  }

  return { orderId: order.id as string, number: order.number as number, ...priced };
}

export { CheckoutError };
