import { describe, expect, it } from "vitest";
import { CheckoutError, priceOrder, shippingFeeFor, type VariantRecord } from "./pricing";
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
