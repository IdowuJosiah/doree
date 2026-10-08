import type { ShippingSettings } from "./data/site";
import { isUsState } from "./us-states";

export class CheckoutError extends Error {}

export const MAX_QUANTITY_PER_LINE = 10;

/** One fixed fee for the listed states, the other fee for everywhere else. */
export function shippingFeeFor(state: string, settings: ShippingSettings): number {
  return settings.fixedFeeStates.includes(state.toUpperCase()) ? settings.fixedFee : settings.otherFee;
}

export type VariantRecord = {
  id: string;
  label: string;
  stock: number;
  product: { id: string; name: string; price: number; published: boolean; archived: boolean; sold_out: boolean };
};

export type PricedLine = {
  productId: string;
  variantId: string;
  name: string;
  /** Cents, taken from the database. */
  price: number;
  quantity: number;
};

export type PricedOrder = { lines: PricedLine[]; subtotal: number; shippingFee: number; total: number };

/**
 * Prices an order entirely from database records. The browser only says which
 * variants and how many; amounts it might send are never read.
 */
export function priceOrder(
  requested: { variantId: string; quantity: number }[],
  variants: VariantRecord[],
  state: string,
  settings: ShippingSettings,
): PricedOrder {
  if (!isUsState(state.toUpperCase())) throw new CheckoutError("Choose a valid delivery state.");
  if (requested.length === 0) throw new CheckoutError("Your bag is empty.");

  const quantities = new Map<string, number>();
  for (const r of requested) {
    if (!Number.isInteger(r.quantity) || r.quantity < 1) throw new CheckoutError("Invalid quantity.");
    quantities.set(r.variantId, (quantities.get(r.variantId) ?? 0) + r.quantity);
  }

  const byId = new Map(variants.map((v) => [v.id, v]));
  const lines: PricedLine[] = [];
  for (const [variantId, quantity] of quantities) {
    const v = byId.get(variantId);
    if (!v || !v.product.published || v.product.archived) throw new CheckoutError("An item in your bag is no longer available.");
    if (v.product.sold_out) throw new CheckoutError(`${v.product.name} is sold out.`);
    if (quantity > MAX_QUANTITY_PER_LINE) throw new CheckoutError(`You can order up to ${MAX_QUANTITY_PER_LINE} of each item.`);
    if (v.stock < quantity) throw new CheckoutError(`Only ${v.stock} of ${v.product.name} (${v.label}) left.`);
    lines.push({
      productId: v.product.id,
      variantId: v.id,
      name: v.label === "One size" ? v.product.name : `${v.product.name} (${v.label})`,
      price: v.product.price,
      quantity,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const shippingFee = shippingFeeFor(state, settings);
  return { lines, subtotal, shippingFee, total: subtotal + shippingFee };
}
