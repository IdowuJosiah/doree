"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/data/catalog";
import { ProductCard } from "./ProductCard";

const PAGE = 12;
const sorts = {
  featured: { label: "Featured", fn: () => 0 },
  "price-asc": { label: "Price, low to high", fn: (a: Product, b: Product) => a.price - b.price },
  "price-desc": { label: "Price, high to low", fn: (a: Product, b: Product) => b.price - a.price },
  name: { label: "Name, A to Z", fn: (a: Product, b: Product) => a.name.localeCompare(b.name) },
} as const;
type SortKey = keyof typeof sorts;

// Sorting and "Load more" happen in the browser, so the page itself stays
// cached and fast.
export function ProductGrid({ products, filters }: { products: Product[]; filters: React.ReactNode }) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [shown, setShown] = useState(PAGE);
  const sorted = useMemo(() => [...products].sort(sorts[sort].fn), [products, sort]);

  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-y border-line py-3">
        {filters}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="label">Sort</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-11 bg-transparent pr-2 text-sm">
            {Object.entries(sorts).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>
      {sorted.length === 0 ? (
        <p className="mt-12">New pieces are on their way.</p>
      ) : (
        <>
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-3 lg:gap-x-6">
            {sorted.slice(0, shown).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          {shown < sorted.length && (
            <div className="mt-16 text-center">
              <button type="button" className="btn-outline" onClick={() => setShown((n) => n + PAGE)}>Load more</button>
              <p className="mt-3 text-sm opacity-70">Showing {shown} of {sorted.length}</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
