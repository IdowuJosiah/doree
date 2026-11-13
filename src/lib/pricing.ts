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

export type PricedOrder = {
  lines: PricedLine[];
  subtotal: number;
  /** Cents taken off the subtotal by a discount code (never off shipping). */
  discount: number;
  discountCode: string | null;
  shippingFee: number;
  total: number;
};

/** A row of the discount_codes table. */
export type DiscountRecord = {
  code: string;
  percent: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  uses: number;
  /** Cents; the order subtotal must be at least this. */
  min_subtotal: number;
};

const dollars = (cents: number) => `$${(cents / 100).toFixed(2).replace(/[.]00$/, "")}`;

/**
 * How many cents a discount code takes off this subtotal, or a CheckoutError
 * saying why it cannot be used. `d` is null when no such code exists.
 */
export function discountFor(d: DiscountRecord | null, subtotal: number, now = new Date()): number {
  if (!d || !d.active || (d.starts_at && new Date(d.starts_at) > now)) throw new CheckoutError("That discount code isn't valid.");
  if (d.ends_at && new Date(d.ends_at) < now) throw new CheckoutError("That discount code has expired.");
  if (d.max_uses !== null && d.uses >= d.max_uses) throw new CheckoutError("That discount code has been used up.");
  if (subtotal < d.min_subtotal) throw new CheckoutError(`That code needs an order of at least ${dollars(d.min_subtotal)} before shipping.`);
  const percent = Math.min(100, Math.max(0, Math.round(d.percent)));
  return Math.min(subtotal, Math.round((subtotal * percent) / 100));
}

/**
 * Prices an order entirely from database records. The browser only says which
 * variants and how many; amounts it might send are never read.
 */
export function priceOrder(
  requested: { variantId: string; quantity: number }[],
  variants: VariantRecord[],
  state: string,
  settings: ShippingSettings,
  /** undefined: no code entered. null: a code was entered but does not exist. */
  discountCode?: DiscountRecord | null,
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
  const discount = discountCode === undefined ? 0 : discountFor(discountCode, subtotal);
  const shippingFee = shippingFeeFor(state, settings);
  // Square cannot take a card payment under $1.00.
  if (discount > 0 && subtotal - discount + shippingFee < 100) throw new CheckoutError("With that code the order would be under $1, which cards can't be charged for.");
  return {
    lines,
    subtotal,
    discount,
    discountCode: discountCode ? discountCode.code : null,
    shippingFee,
    total: subtotal - discount + shippingFee,
  };
}
