import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cover } from "@/components/Cover";
import { CategoryLinks } from "@/components/CategoryLinks";
import { ProductGrid } from "@/components/ProductGrid";
import { getCollectionWithProducts, listCollections } from "@/lib/data/catalog";

type Props = { params: Promise<{ collection: string }> };

// Refreshes at most a minute after any database change, so no redeploy is needed.
export const revalidate = 60;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const found = await getCollectionWithProducts(params.collection);
  return { title: found?.collection.name };
}

export default async function CollectionPage(props: Props) {
  const params = await props.params;
  const [found, collections] = await Promise.all([getCollectionWithProducts(params.collection), listCollections()]);
  if (!found) notFound();
  const { collection, products } = found;

  return (
    <>
      {/* Full-width banner, the same height as the home page hero. */}
      <div className="relative min-h-[70vh] w-full">
        <Cover src={collection.bannerUrl ?? undefined} alt={`${collection.name} banner`} priority sizes="100vw" />
      </div>
      <section className="section container-page">
        <h1 className="display-xl">{collection.name}</h1>
        {collection.intro && <p className="mt-4 max-w-xl">{collection.intro}</p>}
        <ProductGrid products={products} filters={<CategoryLinks collections={collections} current={collection.slug} />} />
      </section>
    </>
  );
}
