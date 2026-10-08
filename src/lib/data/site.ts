import { publicClient } from "@/lib/supabase/public";
import { onReadError } from "./read-error";

export type HeroContent = {
  script: string;
  title: string;
  buttonLabel: string;
  buttonHref: string;
  leftImage: string;
  rightImage: string;
};
export type FeatureContent = {
  script: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonHref: string;
  image: string;
};
export type LookbookPhoto = { url: string; alt: string; productSlug?: string };

export type SiteContent = {
  home_hero: HeroContent;
  brand_statement: { text: string };
  feature_panel: FeatureContent;
  instagram: { handle: string; url: string };
  announcement: { text: string };
  lookbook: { photos: LookbookPhoto[] };
};

export const contentDefaults: SiteContent = {
  home_hero: {
    script: "Jewelry created with love",
    title: "The Soleil Collection",
    buttonLabel: "Shop now",
    buttonHref: "/shop",
    leftImage: "",
    rightImage: "",
  },
  brand_statement: {
    text: "Everyday jewelry, made slowly and worn for years. Each piece is designed to feel like yours.",
  },
  feature_panel: {
    script: "Jewelry created with love",
    title: "Soleil",
    text: "Warm gold, soft curves and pieces light enough to forget you are wearing them.",
    buttonLabel: "Explore",
    buttonHref: "/shop",
    image: "",
  },
  instagram: { handle: "@doree", url: "https://www.instagram.com/" },
  announcement: { text: "" },
  lookbook: { photos: [] },
};

// Rows in site_content override the defaults key by key.
export async function getSiteContent(): Promise<SiteContent> {
  const content: SiteContent = structuredClone(contentDefaults);
  const db = publicClient();
  if (!db) return content;
  const { data, error } = await db.from("site_content").select("key, value");
  if (error) return onReadError(error, content, "site content");
  for (const row of data ?? []) {
    if (row.key in content) {
      const key = row.key as keyof SiteContent;
      Object.assign(content[key], row.value);
    }
  }
  return content;
}

export type ShippingSettings = {
  fixedFeeStates: string[];
  /** Cents. */
  fixedFee: number;
  /** Cents, for every state not in the fixed-fee list. */
  otherFee: number;
};

export const emptyShipping: ShippingSettings = { fixedFeeStates: [], fixedFee: 0, otherFee: 0 };

export const toShippingSettings = (row: { fixed_fee_states: string[]; fixed_fee: number; other_fee: number } | null): ShippingSettings =>
  row ? { fixedFeeStates: row.fixed_fee_states, fixedFee: row.fixed_fee, otherFee: row.other_fee } : emptyShipping;

export async function getShippingSettings(): Promise<ShippingSettings> {
  const db = publicClient();
  if (!db) return emptyShipping;
  const { data, error } = await db.from("shipping_settings").select("fixed_fee_states, fixed_fee, other_fee").eq("id", 1).maybeSingle();
  if (error) return onReadError(error, emptyShipping, "shipping settings");
  return toShippingSettings(data);
}
