import { siteConfig } from "./config";
import type { ShippingSettings } from "./data/site";

// Product data for Google (merchant listings). The shipping times and return
// terms match the Shipping and Returns & Exchanges policy pages: change both
// together.
const HANDLING_DAYS = { min: 1, max: 3 };
const TRANSIT_DAYS = { min: 3, max: 5 };
const RETURN_DAYS = 14;

type ProductInput = { name: string; slug: string; description: string; materials?: string; price: number; soldOut: boolean; images: { src?: string }[] };

/**
 * The product's description, or a short one made from its name and materials
 * when Dorée has not written one yet (Google and link previews need text).
 */
export function productSummary(p: { name: string; description: string; materials?: string }): string {
  const own = p.description.trim();
  if (own) return own;
  const materials = p.materials?.trim().replace(/\.$/, "");
  return [`${p.name} by ${siteConfig.name}.`, materials ? `Materials: ${materials}.` : "", "Everyday jewelry, made to be worn."].filter(Boolean).join(" ");
}

const money = (cents: number) => (cents / 100).toFixed(2);

function shippingDetail(rateCents: number, regions?: string[]) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: money(rateCents), currency: siteConfig.currency },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "US", ...(regions?.length ? { addressRegion: regions } : {}) },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: HANDLING_DAYS.min, maxValue: HANDLING_DAYS.max, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: TRANSIT_DAYS.min, maxValue: TRANSIT_DAYS.max, unitCode: "DAY" },
    },
  };
}

/** What shipping one of this product costs, as Google expects it. */
export function shippingDetailsFor(price: number, s: ShippingSettings) {
  if (s.freeShippingMin !== null && price >= s.freeShippingMin) return [shippingDetail(0)];
  if (s.fixedFee === s.otherFee || s.fixedFeeStates.length === 0) return [shippingDetail(s.otherFee)];
  return [shippingDetail(s.fixedFee, s.fixedFeeStates), shippingDetail(s.otherFee)];
}

export function productJsonLd(p: ProductInput, shipping: ShippingSettings, siteUrl: string) {
  const url = `${siteUrl}/product/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: productSummary(p),
    url,
    sku: p.slug,
    image: p.images.flatMap((i) => (i.src ? [i.src] : [])),
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url,
      price: money(p.price),
      priceCurrency: siteConfig.currency,
      availability: p.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: shippingDetailsFor(p.price, shipping),
      // Exchanges only, within 14 days; the customer pays to send it back.
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: RETURN_DAYS,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
        refundType: "https://schema.org/ExchangeRefund",
        merchantReturnLink: `${siteUrl}/policies/returns`,
      },
    },
  };
}
