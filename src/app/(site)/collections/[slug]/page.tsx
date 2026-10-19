import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/Cover";
import { ProductGrid } from "@/components/ProductGrid";
import { getCollectionWithProducts } from "@/lib/data/catalog";

type Props = { params: Promise<{ slug: string }> };

// Refreshes at most a minute after any database change, so no redeploy is needed.
export const revalidate = 60;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const found = await getCollectionWithProducts((await props.params).slug, "collection");
  return { title: found ? `The ${found.collection.name} collection` : undefined, description: found?.collection.intro || undefined };
}

export default async function NamedCollectionPage(props: Props) {
  const found = await getCollectionWithProducts((await props.params).slug, "collection");
  if (!found) notFound();
  const { collection, products } = found;

  return (
    <>
      {/* Full-width banner, the same height as the home page hero. */}
      <div className="relative min-h-[70vh] w-full">
        <Cover src={collection.bannerUrl ?? undefined} alt={`${collection.name} collection`} priority sizes="100vw" />
      </div>
      <section className="section container-page">
        <h1 className="display-xl">{collection.name}</h1>
        <p className="script-line mt-3">The collection</p>
        {collection.intro && <p className="mt-6 max-w-xl">{collection.intro}</p>}
        <ProductGrid
          products={products}
          filters={
            <nav aria-label="Collections" className="label flex flex-wrap gap-x-6">
              <Link href="/collections" className="flex min-h-[44px] items-center hover:text-gold-text">All collections</Link>
              <Link href="/shop" className="flex min-h-[44px] items-center hover:text-gold-text">Shop all</Link>
            </nav>
          }
        />
      </section>
    </>
  );
}
