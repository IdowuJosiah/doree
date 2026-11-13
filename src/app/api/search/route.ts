import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/data/catalog";

// Suggestions for the search box while someone types: a few products and any
// matching categories or collections. Published products only.
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 100);
  const { products, groups } = await searchCatalog(q);
  return NextResponse.json(
    {
      products: products.slice(0, 6).map((p) => ({
        name: p.name,
        slug: p.slug,
        price: p.price,
        soldOut: p.soldOut,
        image: p.images[0]?.src ? { src: p.images[0].src, position: p.images[0].objectPosition } : null,
      })),
      total: products.length,
      groups: groups.slice(0, 3).map((g) => ({ name: g.name, href: `${g.kind === "collection" ? "/collections" : "/shop"}/${g.slug}`, kind: g.kind })),
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
