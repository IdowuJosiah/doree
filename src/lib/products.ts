export type ProductImage = {
  src?: string;
  alt: string;
  objectPosition?: string;
};

export type Product = {
  name: string;
  slug: string;
  price: number;
  images: ProductImage[];
  variants: { label: string; options: string[] }[];
  collection: string;
  description: string;
  materials: string;
  care: string;
  soldOut?: boolean;
};

export const collections = [
  { slug: "earrings", name: "Earrings" },
  { slug: "necklaces", name: "Necklaces" },
  { slug: "bracelets", name: "Bracelets" },
  { slug: "rings", name: "Rings" },
];

const materials = "18k gold plated sterling silver.";
const care = "Keep dry, store in the pouch provided and wipe gently with a soft cloth.";

const make = (
  collection: string,
  name: string,
  price: number,
  variants: Product["variants"] = [],
  soldOut = false,
): Product => ({
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  price,
  collection,
  variants,
  soldOut,
  materials,
  care,
  description: `${name}, made to be worn every day.`,
  images: [
    { alt: `${name}, front view` },
    { alt: `${name}, worn` },
  ],
});

const ringSizes = { label: "Size", options: ["5", "6", "7", "8"] };

// Sample data. Photos are added through the `src` field of each image.
export const products: Product[] = [
  make("earrings", "Sol Hoops", 68),
  make("earrings", "Luna Studs", 42),
  make("earrings", "Aura Drops", 74),
  make("necklaces", "Odette Chain", 96, [{ label: "Length", options: ['16"', '18"', '20"'] }]),
  make("necklaces", "Mira Pendant", 88, [{ label: "Length", options: ['16"', '18"'] }]),
  make("necklaces", "Celeste Layer", 120, [], true),
  make("bracelets", "Fleur Bangle", 82),
  make("bracelets", "Ines Chain", 64, [{ label: "Length", options: ["6.5", "7"] }]),
  make("bracelets", "Vesper Cuff", 90),
  make("rings", "Ayla Band", 58, [ringSizes]),
  make("rings", "Noor Signet", 72, [ringSizes]),
  make("rings", "Elise Stack", 66, [ringSizes]),
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCollection = (slug: string) => collections.find((c) => c.slug === slug);
export const productsIn = (collection: string) => products.filter((p) => p.collection === collection);
