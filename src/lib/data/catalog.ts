import { publicClient } from "@/lib/supabase/public";
import { onReadError } from "./read-error";

export type ProductImage = {
  src?: string;
  alt: string;
  objectPosition?: string;
};

export type Variant = { id: string; label: string; stock: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  /** Price in cents. */
  price: number;
  description: string;
  materials: string;
  care: string;
  images: ProductImage[];
  variants: Variant[];
  /** True when marked sold out or when no variant has stock. */
  soldOut: boolean;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  bannerUrl: string | null;
  intro: string;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  materials: string;
  care: string;
  sold_out: boolean;
  product_images: { url: string; alt: string; object_position: string; sort_order: number }[];
  product_variants: Variant[];
};

const PRODUCT_COLUMNS =
  "id, name, slug, price, description, materials, care, sold_out, " +
  "product_images(url, alt, object_position, sort_order), product_variants(id, label, stock)";

export function toProduct(row: ProductRow): Product {
  const images: ProductImage[] = [...row.product_images]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({ src: i.url, alt: i.alt || row.name, objectPosition: i.object_position }));
  const variants = [...row.product_variants].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    price: row.price,
    description: row.description,
    materials: row.materials,
    care: row.care,
    images: images.length ? images : [{ alt: row.name }],
    variants,
    soldOut: row.sold_out || !variants.some((v) => v.stock > 0),
  };
}

// Public reads rely on row-level security: only published, non-archived
// products are visible to the anonymous client.
export async function listProducts(): Promise<Product[]> {
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();
  if (error) return onReadError(error, [], "products");
  return (data ?? []).map(toProduct);
}

/**
 * Products Dorée has ticked as best sellers. If none are ticked, falls back to
 * the published products that have sold the most.
 */
export async function listBestSellers(limit = 4): Promise<Product[]> {
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("best_seller", true)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ProductRow[]>();
  if (error) return onReadError(error, [], "best sellers");
  if (data?.length) return data.map(toProduct);

  const { data: ranked, error: rankError } = await db.rpc("best_selling_product_ids", { max_count: limit });
  if (rankError) return onReadError(rankError, [], "best sellers");
  const ids = ((ranked ?? []) as (string | Record<string, string>)[]).map((r) =>
    typeof r === "string" ? r : r.best_selling_product_ids,
  );
  if (!ids.length) return [];

  const { data: rows, error: rowsError } = await db.from("products").select(PRODUCT_COLUMNS).in("id", ids).returns<ProductRow[]>();
  if (rowsError) return onReadError(rowsError, [], "best sellers");
  return (rows ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)).map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = publicClient();
  if (!db) return null;
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle<ProductRow>();
  if (error) return onReadError(error, null, "product");
  return data ? toProduct(data) : null;
}

export async function listCollections(): Promise<Collection[]> {
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("collections")
    .select("id, name, slug, banner_url, intro")
    .order("sort_order");
  if (error) return onReadError(error, [], "collections");
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, bannerUrl: c.banner_url, intro: c.intro }));
}

export async function getCollectionWithProducts(slug: string) {
  const db = publicClient();
  if (!db) return null;
  const { data: c, error } = await db
    .from("collections")
    .select("id, name, slug, banner_url, intro")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return onReadError(error, null, "collection");
  if (!c) return null;

  const { data: links, error: linkError } = await db
    .from("collection_products")
    .select(`sort_order, products(${PRODUCT_COLUMNS})`)
    .eq("collection_id", c.id)
    .order("sort_order")
    .returns<{ sort_order: number; products: ProductRow | null }[]>();
  if (linkError) return onReadError(linkError, null, "collection products");

  const collection: Collection = { id: c.id, name: c.name, slug: c.slug, bannerUrl: c.banner_url, intro: c.intro };
  const products = (links ?? []).flatMap((l) => (l.products ? [toProduct(l.products)] : []));
  return { collection, products };
}
