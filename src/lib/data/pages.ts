import { publicClient } from "@/lib/supabase/public";
import { onReadError } from "./read-error";

export type TextPage = { title: string; intro: string; body: string };

/** Pages Dorée edits in /admin/content. Defaults show until she saves her own. */
export const PAGE_DEFAULTS: Record<string, TextPage> = {
  "size-guide": {
    title: "Size guide",
    intro: "Find your ring, bracelet and necklace size. If you are between sizes, choose the larger one.",
    body: "## Rings\nWrap a strip of paper around the base of your finger, mark where it meets, and measure the length in millimetres. Match it to the circumference in the table below.\n\n## Bracelets\nMeasure around your wrist just above the bone and add about half an inch for a comfortable fit.\n\n## Necklaces\nA 16\" chain sits at the collarbone, 18\" just below it, and 20\" a little lower on the chest.",
  },
  "jewelry-care": {
    title: "Jewelry care",
    intro: "A little care keeps every piece bright for years.",
    body: "## Every day\nPut your jewelry on last, after perfume, lotion and hairspray, and take it off first.\n\n## Water\nRemove pieces before swimming, showering or exercising.\n\n## Cleaning\nWipe gently with a soft, dry cloth. Avoid chemical cleaners.\n\n## Storing\nKeep each piece in its pouch, away from moisture and direct sunlight.",
  },
  materials: {
    title: "Materials",
    intro: "What our jewelry is made of, and why.",
    body: "## Gold plated sterling silver\nA solid sterling silver base with a layer of 18k gold, for the warmth of gold at an everyday price.\n\n## Sterling silver\n92.5% pure silver, hypoallergenic and made to last.",
  },
  shipping: {
    title: "Shipping",
    intro: "How delivery and shipping fees work.",
    body: "## Fees\nThe shipping fee is calculated at checkout from your delivery state.\n\n## Delivery\nWe arrange delivery ourselves and will be in touch by email once your order is on its way.",
  },
  returns: {
    title: "Returns & exchanges",
    intro: "Exchanges are welcome within 14 days of delivery. We do not offer refunds.",
    body: "## Return window\nAll returns and exchanges must be started within 14 days of the date of delivery.\n\n## Condition requirements\nItems must be:\n- Unworn and unwashed\n- In their original packaging\n- Free from damage or defects caused by customer misuse\n\n## What's allowed\nWe offer exchanges only. Refunds are not offered.\n- Exchange for a different size\n- Exchange for a different color\n- Exchange for a different design\n\n## Shipping\n- The customer pays the cost of shipping the return\n- Dorée & Co covers the cost of shipping the exchange to you\n\n## Items not eligible for return or exchange\n- Personalized or custom-ordered pieces\n- Items damaged through customer misuse or neglect\n- Items returned without their original packaging\n- Items that have been worn or washed\n\n## How to start a return or exchange\n1. DM @doreeofficial_ on Instagram within 14 days of delivery\n2. Include photos of the item, unworn and in its packaging\n3. Tell us the reason for the return or exchange\n4. Wait for our confirmation and return shipping instructions\n5. Ship the item back at your expense\n6. Once we have received and inspected it, we will send your exchange\n\n## Care\nTo preserve your piece, avoid harsh chemicals, perfumes and alcohol, and store it in a dry place. All Dorée & Co jewelry is 100% non-tarnish and designed to last when cared for properly.\n\n## Questions?\nDM us anytime on Instagram: @doreeofficial_",
  },
  privacy: { title: "Privacy", intro: "How we look after your information.", body: "We use your details only to process your order and, if you sign up, to tell you about new collections. Payments are handled by Square; we never see or store your card details." },
  terms: { title: "Terms", intro: "The terms of using this site and buying from us.", body: "Our full terms will be published here soon." },
  about: {
    title: "About Dorée",
    intro: "Jewelry created with love.",
    body: "Dorée began with a simple idea: everyday jewelry should feel special, and special jewelry should be worn every day.\n\nEach piece is designed to be light, warm and easy to live in, made to be layered, stacked and kept for years.",
  },
};

export async function getPage(slug: string): Promise<TextPage | null> {
  const defaults = PAGE_DEFAULTS[slug];
  if (!defaults) return null;
  const db = publicClient();
  if (!db) return defaults;
  const { data, error } = await db.from("site_content").select("value").eq("key", `page:${slug}`).maybeSingle();
  if (error) return onReadError(error, defaults, `page ${slug}`);
  const saved = (data?.value ?? {}) as Partial<TextPage>;
  return {
    title: saved.title || defaults.title,
    intro: saved.intro ?? defaults.intro,
    body: saved.body?.trim() ? saved.body : defaults.body,
  };
}
