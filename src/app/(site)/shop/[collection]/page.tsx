import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cover } from "@/components/Cover";
import { CategoryLinks } from "@/components/CategoryLinks";
import { ProductGrid } from "@/components/ProductGrid";
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
      <ProductGrid products={products} filters={<CategoryLinks collections={collections} current={collection.slug} />} />
    </section>
  );
}
