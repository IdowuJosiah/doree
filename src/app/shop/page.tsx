import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { collections, products } from "@/lib/products";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <section className="section container-page">
      <h1 className="display-xl">Shop</h1>
      <p className="mt-4 max-w-xl">Everyday pieces in gold and silver, made to be worn and loved.</p>
      <nav aria-label="Categories" className="label mt-10 flex flex-wrap gap-6 border-y border-line py-4">
        <Link href="/shop" className="text-olive">All</Link>
        {collections.map((c) => (
          <Link key={c.slug} href={`/shop/${c.slug}`} className="hover:text-olive">
            {c.name}
          </Link>
        ))}
      </nav>
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-3 lg:gap-x-6">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
