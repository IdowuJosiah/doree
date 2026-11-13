import { describe, expect, it } from "vitest";
import { CheckoutError, discountFor, priceOrder, shippingFeeFor, type DiscountRecord, type VariantRecord } from "./pricing";
import type { ShippingSettings } from "./data/site";

const settings: ShippingSettings = { fixedFeeStates: ["NY", "NJ"], fixedFee: 800, otherFee: 1500 };

const variant = (id: string, over: Partial<VariantRecord["product"]> = {}, stock = 5): VariantRecord => ({
  id,
  label: "One size",
  stock,
  product: { id: `p-${id}`, name: `Ring ${id}`, price: 6800, published: true, archived: false, sold_out: false, ...over },
});

describe("shippingFeeFor", () => {
  it("charges the fixed fee for listed states and the other fee elsewhere", () => {
    expect(shippingFeeFor("NY", settings)).toBe(800);
    expect(shippingFeeFor("ny", settings)).toBe(800);
    expect(shippingFeeFor("TX", settings)).toBe(1500);
  });
});

describe("priceOrder", () => {
  it("prices from database records and adds shipping", () => {
    const o = priceOrder([{ variantId: "a", quantity: 2 }], [variant("a")], "TX", settings);
    expect(o.subtotal).toBe(13600);
    expect(o.shippingFee).toBe(1500);
    expect(o.total).toBe(15100);
    expect(o.lines[0]).toMatchObject({ price: 6800, quantity: 2, name: "Ring a" });
  });

  it("ignores any price the browser might send", () => {
    const tampered = [{ variantId: "a", quantity: 1, price: 1 }] as unknown as { variantId: string; quantity: number }[];
    expect(priceOrder(tampered, [variant("a")], "NY", settings).total).toBe(6800 + 800);
  });

  it("merges duplicate lines before checking stock", () => {
    const items = [{ variantId: "a", quantity: 3 }, { variantId: "a", quantity: 3 }];
    expect(() => priceOrder(items, [variant("a", {}, 5)], "NY", settings)).toThrow(/Only 5/);
  });

  it("rejects unpublished, archived, sold-out and unknown items", () => {
    const q = [{ variantId: "a", quantity: 1 }];
    expect(() => priceOrder(q, [variant("a", { published: false })], "NY", settings)).toThrow(CheckoutError);
    expect(() => priceOrder(q, [variant("a", { archived: true })], "NY", settings)).toThrow(CheckoutError);
    expect(() => priceOrder(q, [variant("a", { sold_out: true })], "NY", settings)).toThrow(/sold out/);
    expect(() => priceOrder(q, [], "NY", settings)).toThrow(CheckoutError);
  });

  it("rejects out-of-stock, bad quantities, bad states and empty bags", () => {
    expect(() => priceOrder([{ variantId: "a", quantity: 1 }], [variant("a", {}, 0)], "NY", settings)).toThrow(/Only 0/);
    expect(() => priceOrder([{ variantId: "a", quantity: 0 }], [variant("a")], "NY", settings)).toThrow(/quantity/);
    expect(() => priceOrder([{ variantId: "a", quantity: 1.5 }], [variant("a")], "NY", settings)).toThrow(/quantity/);
    expect(() => priceOrder([{ variantId: "a", quantity: 1 }], [variant("a")], "ZZ", settings)).toThrow(/state/);
    expect(() => priceOrder([], [], "NY", settings)).toThrow(/empty/);
  });
});

const code = (over: Partial<DiscountRecord> = {}): DiscountRecord => ({
  code: "GOLDEN15", percent: 15, active: true, starts_at: null, ends_at: null, max_uses: null, uses: 0, min_subtotal: 0, ...over,
});

describe("discount codes", () => {
  it("takes the percentage off the subtotal only, never shipping", () => {
    const o = priceOrder([{ variantId: "a", quantity: 2 }], [variant("a")], "TX", settings, code());
    expect(o.subtotal).toBe(13600);
    expect(o.discount).toBe(2040); // 15% of 136.00
    expect(o.shippingFee).toBe(1500);
    expect(o.total).toBe(13600 - 2040 + 1500);
    expect(o.discountCode).toBe("GOLDEN15");
  });

  it("charges the full price when no code is entered", () => {
    const o = priceOrder([{ variantId: "a", quantity: 1 }], [variant("a")], "TX", settings);
    expect(o).toMatchObject({ discount: 0, discountCode: null, total: 6800 + 1500 });
  });

  it("rounds to the nearest cent and never goes below zero", () => {
    expect(discountFor(code({ percent: 33 }), 999)).toBe(330);
    expect(discountFor(code({ percent: 100 }), 6800)).toBe(6800);
    expect(discountFor(code({ percent: 150 }), 6800)).toBe(6800);
  });

  it("refuses unknown, switched off, not yet started, expired and used up codes", () => {
    const now = new Date("2026-11-13T12:00:00Z");
    expect(() => discountFor(null, 5000, now)).toThrow("isn't valid");
    expect(() => discountFor(code({ active: false }), 5000, now)).toThrow("isn't valid");
    expect(() => discountFor(code({ starts_at: "2026-12-01T00:00:00Z" }), 5000, now)).toThrow("isn't valid");
    expect(() => discountFor(code({ ends_at: "2026-11-01T00:00:00Z" }), 5000, now)).toThrow("expired");
    expect(() => discountFor(code({ max_uses: 10, uses: 10 }), 5000, now)).toThrow("used up");
    expect(discountFor(code({ max_uses: 10, uses: 9 }), 5000, now)).toBe(750);
  });

  it("enforces a minimum order", () => {
    expect(() => discountFor(code({ min_subtotal: 10000 }), 6800)).toThrow("at least $100 before shipping");
    expect(discountFor(code({ min_subtotal: 6800 }), 6800)).toBe(1020);
  });

  it("an entered code that does not exist stops checkout with a message", () => {
    expect(() => priceOrder([{ variantId: "a", quantity: 1 }], [variant("a")], "TX", settings, null)).toThrow(CheckoutError);
  });
});
