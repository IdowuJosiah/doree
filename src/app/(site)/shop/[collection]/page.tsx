import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/Cover";
import { ProductCard } from "@/components/ProductCard";
import { getCollectionWithProducts, listCollections } from "@/lib/data/catalog";

type Props = { params: { collection: string } };

// Refreshes at most a minute after any database change, so no redeploy is needed.
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getCollectionWithProducts(params.collection);
  return { title: found?.collection.name };
}

export default async function CollectionPage({ params }: Props) {
  const [found, collections] = await Promise.all([getCollectionWithProducts(params.collection), listCollections()]);
  if (!found) notFound();
  const { collection, products } = found;

  return (
    <section className="section container-page">
      <div className="relative mb-10 h-48 lg:h-72">
        <Cover src={collection.bannerUrl ?? undefined} alt={`${collection.name} banner`} />
      </div>
      <h1 className="display-xl">{collection.name}</h1>
      {collection.intro && <p className="mt-4 max-w-xl">{collection.intro}</p>}
      <nav aria-label="Categories" className="label mt-10 flex flex-wrap gap-6 border-y border-line py-4">
        <Link href="/shop" className="hover:text-olive">All</Link>
        {collections.map((c) => (
          <Link key={c.id} href={`/shop/${c.slug}`} className={c.id === collection.id ? "text-olive" : "hover:text-olive"}>
            {c.name}
          </Link>
        ))}
      </nav>
      {products.length === 0 ? (
        <p className="mt-12">Nothing here yet.</p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-3 lg:gap-x-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
