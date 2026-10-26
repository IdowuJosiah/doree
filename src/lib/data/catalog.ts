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

/** "category" = a product type (Earrings…), "collection" = a named set (Soleil…). */
export type GroupKind = "category" | "collection";

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

export async function listProductsByIds(ids: string[]): Promise<Product[]> {
  const db = publicClient();
  if (!db || ids.length === 0) return [];
  const { data, error } = await db.from("products").select(PRODUCT_COLUMNS).in("id", ids).returns<ProductRow[]>();
  if (error) return onReadError(error, [], "products");
  return (data ?? []).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)).map(toProduct);
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

/** Product types by default; pass "collection" for named collections. */
export async function listCollections(kind: GroupKind = "category"): Promise<Collection[]> {
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("collections")
    .select("id, name, slug, banner_url, intro")
    .eq("kind", kind)
    .order("sort_order");
  if (error) return onReadError(error, [], "collections");
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, bannerUrl: c.banner_url, intro: c.intro }));
}

/** The named collections a product belongs to, for links on its page. */
export async function listCollectionsForProduct(productId: string): Promise<Pick<Collection, "name" | "slug">[]> {
  const db = publicClient();
  if (!db) return [];
  const { data, error } = await db
    .from("collection_products")
    .select("collections!inner(name, slug, kind, sort_order)")
    .eq("product_id", productId)
    .eq("collections.kind", "collection")
    .returns<{ collections: { name: string; slug: string; sort_order: number } }[]>();
  if (error) return onReadError(error, [], "product collections");
  return (data ?? [])
    .map((r) => r.collections)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(({ name, slug }) => ({ name, slug }));
}

export async function getCollectionWithProducts(slug: string, kind: GroupKind = "category") {
  const db = publicClient();
  if (!db) return null;
  const { data: c, error } = await db
    .from("collections")
    .select("id, name, slug, banner_url, intro")
    .eq("slug", slug)
    .eq("kind", kind)
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

/**
 * Words to search for: lower case, letters and numbers only (so they are safe
 * inside a database pattern), at most five.
 */
export function searchTerms(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^-+|-+$/g, ""))
    .filter((w) => w.length > 1)
    .slice(0, 5);
}

/**
 * Published products where every word starts a word in the name,
 * description or materials, plus the products in any category or collection
 * whose name matches. Name matches come first.
 */
export async function searchCatalog(q: string): Promise<{ products: Product[]; groups: (Collection & { kind: GroupKind })[] }> {
  const words = searchTerms(q);
  const db = publicClient();
  if (!db || words.length === 0) return { products: [], groups: [] };
  // "w*" or "* w*" matches a word that starts with w, so "ring" finds "Rings"
  // but not "Earrings". (* is the database's any-characters wildcard.)
  const startsWord = (field: string, w: string) => `${field}.ilike.${w}*,${field}.ilike.* ${w}*`;

  let productQuery = db.from("products").select(PRODUCT_COLUMNS);
  for (const w of words) {
    productQuery = productQuery.or(["name", "description", "materials"].map((f) => startsWord(f, w)).join(","));
  }
  let groupQuery = db.from("collections").select("id, name, slug, kind, banner_url, intro").order("sort_order");
  for (const w of words) groupQuery = groupQuery.or(startsWord("name", w));

  const [{ data: rows, error }, { data: groupRows, error: groupError }] = await Promise.all([
    productQuery.limit(60).returns<ProductRow[]>(),
    groupQuery,
  ]);
  if (error) return onReadError(error, { products: [], groups: [] }, "search");
  if (groupError) return onReadError(groupError, { products: [], groups: [] }, "search");

  const groups = (groupRows ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, kind: c.kind as GroupKind, bannerUrl: c.banner_url, intro: c.intro }));
  let inGroups: ProductRow[] = [];
  if (groups.length) {
    const { data: links } = await db
      .from("collection_products")
      .select(`products(${PRODUCT_COLUMNS})`)
      .in("collection_id", groups.map((g) => g.id))
      .returns<{ products: ProductRow | null }[]>();
    inGroups = (links ?? []).flatMap((l) => (l.products ? [l.products] : []));
  }

  const byName = (r: ProductRow) => words.every((w) => ` ${r.name.toLowerCase()}`.includes(` ${w}`));
  const seen = new Set<string>();
  const products = [...(rows ?? []).filter(byName), ...(rows ?? []), ...inGroups]
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
    .map(toProduct);
  return { products, groups };
}
