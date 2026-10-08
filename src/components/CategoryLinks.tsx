import Link from "next/link";
import type { Collection } from "@/lib/data/catalog";

export function CategoryLinks({ collections, current }: { collections: Collection[]; current?: string }) {
  const cls = (active: boolean) => `flex min-h-[44px] items-center ${active ? "text-olive" : "hover:text-olive"}`;
  return (
    <nav aria-label="Categories" className="label flex flex-wrap gap-x-6">
      <Link href="/shop" className={cls(!current)} aria-current={!current ? "page" : undefined}>All</Link>
      {collections.map((c) => (
        <Link key={c.id} href={`/shop/${c.slug}`} className={cls(c.slug === current)} aria-current={c.slug === current ? "page" : undefined}>{c.name}</Link>
      ))}
    </nav>
  );
}
