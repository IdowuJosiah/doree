import "server-only";
import { z } from "zod";
import { CheckoutError, priceOrder, type VariantRecord } from "./pricing";
import { toShippingSettings } from "./data/site";
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
  address: z.object({
    line1: z.string().trim().min(1).max(200),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().toUpperCase().refine(isUsState, "Choose a valid state"),
    postalCode: z.string().trim().min(3).max(12),
  }),
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
    .select("fixed_fee_states, fixed_fee, other_fee")
    .eq("id", 1)
    .maybeSingle();
  if (shippingError) throw shippingError;

  const priced = priceOrder(input.items, variants, input.address.state, toShippingSettings(shippingRow));

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      customer_id: customerId,
      email: input.email,
      name: input.name,
      address: input.address,
      state: input.address.state,
      subtotal: priced.subtotal,
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
