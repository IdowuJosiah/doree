import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";
import { SearchInput } from "@/components/SearchInput";
import { listCollections, searchCatalog } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await props.searchParams).q ?? "").slice(0, 100).trim();
  const [{ products, groups }, categories] = await Promise.all([
    q ? searchCatalog(q) : Promise.resolve({ products: [], groups: [] }),
    listCollections("category"),
  ]);
  const href = (g: { kind: string; slug: string }) => `${g.kind === "collection" ? "/collections" : "/shop"}/${g.slug}`;
  const link = "flex min-h-[44px] items-center hover:text-gold-text";

  return (
    <section className="section container-page">
      <h1 className="display-xl">Search</h1>
      <form action="/search" role="search" className="mt-8 flex max-w-xl gap-3">
        <label htmlFor="q" className="sr-only">Search the shop</label>
        <SearchInput defaultValue={q} />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {q && (
        <p className="mt-6" role="status">
          {products.length === 0
            ? <>Nothing found for “{q}”.</>
            : <>{products.length} {products.length === 1 ? "piece" : "pieces"} for “{q}”.</>}
        </p>
      )}

      {products.length > 0 ? (
        <ProductGrid
          products={products}
          filters={
            <nav aria-label="Related" className="label flex flex-wrap gap-x-6">
              {groups.length > 0
                ? groups.map((g) => <Link key={g.id} href={href(g)} className={link}>{g.kind === "collection" ? `The ${g.name} collection` : `All ${g.name}`}</Link>)
                : <Link href="/shop" className={link}>Shop all</Link>}
            </nav>
          }
        />
      ) : (
        categories.length > 0 && (
          <div className="mt-10">
            <p className="label mb-2">{q ? "Try browsing instead" : "Or browse"}</p>
            <nav aria-label="Categories" className="label flex flex-wrap gap-x-6">
              <Link href="/shop" className={link}>Shop all</Link>
              {categories.map((c) => <Link key={c.id} href={`/shop/${c.slug}`} className={link}>{c.name}</Link>)}
              <Link href="/collections" className={link}>Collections</Link>
            </nav>
          </div>
        )
      )}
    </section>
  );
}
