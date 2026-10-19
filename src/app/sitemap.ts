import type { MetadataRoute } from "next";
import { publicClient } from "@/lib/supabase/public";
import { onReadError } from "@/lib/data/read-error";
import { SITE_URL } from "@/lib/site-url";

export const revalidate = 3600;

const STATIC = [
  "",
  "/shop",
  "/collections",
  "/lookbook",
  "/about",
  "/contact",
  "/guides",
  "/guides/size-guide",
  "/guides/jewelry-care",
  "/guides/materials",
  "/policies/shipping",
  "/policies/returns",
  "/policies/privacy",
  "/policies/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC.map((path) => ({ url: `${SITE_URL}${path}` }));
  const db = publicClient();
  if (!db) return entries;

  // Row-level security limits the anonymous client to published products.
  const [collections, products] = await Promise.all([
    db.from("collections").select("slug, kind").order("sort_order"),
    db.from("products").select("slug, created_at").order("created_at", { ascending: false }),
  ]);
  const c = collections.error ? onReadError(collections.error, [], "collections") : collections.data ?? [];
  const p = products.error ? onReadError(products.error, [], "products") : products.data ?? [];

  return [
    ...entries,
    ...c.map((x: { slug: string; kind: string }) => ({ url: `${SITE_URL}${x.kind === "collection" ? "/collections" : "/shop"}/${x.slug}` })),
    ...p.map((x: { slug: string; created_at: string }) => ({ url: `${SITE_URL}/product/${x.slug}`, lastModified: x.created_at })),
  ];
}
