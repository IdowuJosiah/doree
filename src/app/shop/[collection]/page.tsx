import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { collections, getCollection, productsIn } from "@/lib/products";

type Props = { params: { collection: string } };

export const generateStaticParams = () => collections.map((c) => ({ collection: c.slug }));

export function generateMetadata({ params }: Props): Metadata {
  return { title: getCollection(params.collection)?.name };
}

export default function CollectionPage({ params }: Props) {
  const collection = getCollection(params.collection);
  if (!collection) notFound();

  return (
    <section className="section container-page">
      <div className="mb-10 h-48 bg-cream-deep lg:h-72" role="img" aria-label={`${collection.name} banner`} />
      <h1 className="display-xl">{collection.name}</h1>
      <nav aria-label="Categories" className="label mt-10 flex flex-wrap gap-6 border-y border-line py-4">
        <Link href="/shop" className="hover:text-olive">All</Link>
        {collections.map((c) => (
          <Link key={c.slug} href={`/shop/${c.slug}`} className={c.slug === collection.slug ? "text-olive" : "hover:text-olive"}>
            {c.name}
          </Link>
        ))}
      </nav>
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-3 lg:gap-x-6">
        {productsIn(collection.slug).map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
