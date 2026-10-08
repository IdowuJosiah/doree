import type { Metadata } from "next";
import { CategoryLinks } from "@/components/CategoryLinks";
import { ProductGrid } from "@/components/ProductGrid";
import { listCollections, listProducts } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Shop" };
// Refreshes at most a minute after any database change, so no redeploy is needed.
export const revalidate = 60;

export default async function ShopPage() {
  const [products, collections] = await Promise.all([listProducts(), listCollections()]);
  return (
    <section className="section container-page">
      <h1 className="display-xl">Shop</h1>
      <p className="mt-4 max-w-xl">Everyday pieces in gold and silver, made to be worn and loved.</p>
      <ProductGrid products={products} filters={<CategoryLinks collections={collections} />} />
    </section>
  );
}
