import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { Card, Field, Notice, Small } from "../_components/ui";
import { createGroup } from "./actions";
import { KINDS, type GroupKind } from "./kinds";

export async function GroupList({ kind, searchParams }: { kind: GroupKind; searchParams: { error?: string; saved?: string } }) {
  const k = KINDS[kind];
  const db = await adminDb();
  const { data } = await db
    .from("collections")
    .select("id, name, slug, sort_order, collection_products(product_id)")
    .eq("kind", kind)
    .order("sort_order");
  return (
    <>
      <h1 className="font-display text-4xl uppercase">{k.plural}</h1>
      <p className="mb-6 mt-2 max-w-2xl">{k.intro}</p>
      <Notice searchParams={searchParams} />
      <ul className="mb-10 divide-y divide-line border-y border-line">
        {(data ?? []).map((c) => (
          <li key={c.id} className="flex items-center justify-between py-3">
            <Link href={`${k.path}/${c.id}`} className="text-link">{c.name}</Link>
            <span className="text-sm opacity-70">{k.publicPath}/{c.slug} · {c.collection_products?.length ?? 0} products</span>
          </li>
        ))}
      </ul>
      {(data ?? []).length === 0 && <p className="mb-10 text-sm">No {k.plural.toLowerCase()} yet.</p>}
      <Card title={`Add a ${k.singular}`}>
        <form action={createGroup.bind(null, kind)} className="flex flex-wrap items-end gap-3">
          <Field label="Name" name="name" required hint={k.placeholder} />
          <Small>Create</Small>
        </form>
      </Card>
    </>
  );
}
