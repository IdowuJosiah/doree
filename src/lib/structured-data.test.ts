import { describe, expect, it } from "vitest";
import { productJsonLd, shippingDetailsFor } from "./structured-data";
import type { ShippingSettings } from "./data/site";

const s: ShippingSettings = { fixedFeeStates: ["TX"], fixedFee: 700, otherFee: 700, pickupEnabled: true, pickupZips: ["77449"], pickupNote: "", freeShippingMin: 12500 };
const product = { name: "Odette Chain", slug: "odette-chain", description: "A chain", price: 6800, soldOut: false, images: [{ src: "https://x/a.jpg" }, {}] };

describe("product structured data", () => {
  it("has a brand, shipping details and a return policy", () => {
    const ld = productJsonLd(product, s, "https://www.shopdoree.co");
    expect(ld.brand.name).toBe("Dorée");
    expect(ld.image).toEqual(["https://x/a.jpg"]);
    expect(ld.offers.shippingDetails[0].shippingRate.value).toBe("7.00");
    expect(ld.offers.hasMerchantReturnPolicy.merchantReturnDays).toBe(14);
    expect(ld.offers.hasMerchantReturnPolicy.merchantReturnLink).toBe("https://www.shopdoree.co/policies/returns");
  });

  it("shows free shipping for items over the free-shipping amount", () => {
    expect(shippingDetailsFor(13000, s)[0].shippingRate.value).toBe("0.00");
  });

  it("lists both fees when they differ", () => {
    const d = shippingDetailsFor(6800, { ...s, otherFee: 1500 });
    expect(d.map((x) => x.shippingRate.value)).toEqual(["7.00", "15.00"]);
    expect(d[0].shippingDestination).toMatchObject({ addressRegion: ["TX"] });
  });
});
