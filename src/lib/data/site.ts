import { publicClient } from "@/lib/supabase/public";
import { onReadError } from "./read-error";

export type HeroContent = {
  script: string;
  title: string;
  buttonLabel: string;
  buttonHref: string;
  leftImage: string;
  rightImage: string;
  /** Framing for each photo, see src/lib/framing.ts. */
  leftImageFrame?: string;
  rightImageFrame?: string;
};
export type FeatureContent = {
  script: string;
  title: string;
  text: string;
  buttonLabel: string;
  buttonHref: string;
  image: string;
  imageFrame?: string;
};
export type ComingSoonContent = {
  enabled: boolean;
  script: string;
  title: string;
  text: string;
  /** Free text such as "Launching March 2027". Empty hides it. */
  launch: string;
  image: string;
  imageFrame?: string;
};
/**
 * Pre-launch teaser. While enabled, every shop page shows only this (with an
 * email sign-up); the admin and the policy pages still work.
 */
export type TeaserContent = {
  enabled: boolean;
  title: string;
  script: string;
  text: string;
  image: string;
  imageFrame?: string;
};
export type CatalogCover = { url: string; position?: string };
export type LookbookPhoto = { url: string; alt: string; productSlug?: string; position?: string };

export type SiteContent = {
  home_hero: HeroContent;
  brand_statement: { text: string };
  feature_panel: FeatureContent;
  instagram: { handle: string; url: string };
  announcement: { text: string };
  coming_soon: ComingSoonContent;
  teaser: TeaserContent;
  lookbook: { photos: LookbookPhoto[] };
  /** Portrait cover photo for each collection tile in the home catalog, by collection id. */
  catalog_covers: Record<string, CatalogCover>;
  /** Framing of each category/collection banner, by its id. */
  banner_frames: Record<string, string>;
  /** Photos on the text pages, by slot (see PAGE_PHOTO_SLOTS). */
  page_photos: Record<string, CatalogCover>;
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
    text: "She who is golden",
  },
  feature_panel: {
    script: "Jewelry created with love",
    title: "Soleil",
    text: "Warm gold, soft curves and pieces light enough to forget you are wearing them.",
    buttonLabel: "Explore",
    buttonHref: "/shop",
    image: "",
  },
  instagram: { handle: "@doreeofficial_", url: "https://www.instagram.com/doreeofficial_/" },
  announcement: { text: "" },
  coming_soon: {
    enabled: true,
    script: "Coming soon",
    title: "The new collection",
    text: "Something new is on its way. Leave your email and be the first to know when it launches.",
    launch: "",
    image: "",
  },
  teaser: {
    enabled: true,
    title: "Golden Hour",
    script: "Dropping soon",
    text: "Our Golden Hour collection is almost here. Be the first to know when it drops.",
    image: "",
  },
  lookbook: { photos: [] },
  catalog_covers: {},
  banner_frames: {},
  page_photos: {},
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

/**
 * Photo spots on the text pages: the tiles on the Care and guides page and
 * the About page header and strip. `shape`/`aspect` match where they appear.
 */
export const PAGE_PHOTO_SLOTS = {
  "guide:size-guide": { page: "size-guide", label: "Tile on the Care and guides page", shape: "arch", aspect: "3 / 4" },
  "guide:jewelry-care": { page: "jewelry-care", label: "Tile on the Care and guides page", shape: "quarter", aspect: "3 / 4" },
  "guide:materials": { page: "materials", label: "Tile on the Care and guides page", shape: "arch", aspect: "3 / 4" },
  "about:header": { page: "about", label: "Header photo (behind the title)", shape: "rect", aspect: "2 / 1" },
  "about:1": { page: "about", label: "Photo strip, left", shape: "arch", aspect: "3 / 4" },
  "about:2": { page: "about", label: "Photo strip, middle", shape: "arch", aspect: "3 / 4" },
  "about:3": { page: "about", label: "Photo strip, right", shape: "arch", aspect: "3 / 4" },
} as const;
export type PagePhotoSlot = keyof typeof PAGE_PHOTO_SLOTS;
