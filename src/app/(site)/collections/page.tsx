import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/Cover";
import { Reveal } from "@/components/Reveal";
import { listCollections } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Collections" };
// Refreshes at most a minute after any database change, so no redeploy is needed.
export const revalidate = 60;

export default async function CollectionsPage() {
  const collections = await listCollections("collection");
  return (
    <section className="section container-page">
      <h1 className="display-xl">Collections</h1>
      <p className="script-line mt-3">Made for you</p>
      {collections.length === 0 ? (
        <p className="mt-12">The first collection is on its way.</p>
      ) : (
        <div className="mt-12 grid gap-x-6 gap-y-14 lg:grid-cols-2">
          {collections.map((c) => (
            <Reveal key={c.id}>
              <Link href={`/collections/${c.slug}`} className="zoom block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Cover src={c.bannerUrl ?? undefined} alt={`${c.name} collection`} sizes="(min-width: 1024px) 50vw, 100vw" />
                </div>
                <h2 className="mt-5 font-display text-3xl">{c.name}</h2>
                {c.intro && <p className="mt-2 max-w-md">{c.intro}</p>}
                <span className="label mt-4 inline-block border-b border-current pb-0.5">Discover</span>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
