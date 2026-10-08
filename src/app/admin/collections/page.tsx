import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { Card, Field, Notice, Small } from "../_components/ui";
import { createCollection } from "./actions";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const db = await adminDb();
  const { data } = await db.from("collections").select("id, name, slug, sort_order, collection_products(product_id)").order("sort_order");
  return (
    <>
      <h1 className="mb-6 font-display text-4xl uppercase">Collections</h1>
      <Notice searchParams={searchParams} />
      <ul className="mb-10 divide-y divide-line border-y border-line">
        {(data ?? []).map((c) => (
          <li key={c.id} className="flex items-center justify-between py-3">
            <Link href={`/admin/collections/${c.id}`} className="text-link">{c.name}</Link>
            <span className="text-sm opacity-70">/{c.slug} · {c.collection_products.length} products</span>
          </li>
        ))}
      </ul>
      <Card title="Add a collection">
        <form action={createCollection} className="flex flex-wrap items-end gap-3">
          <Field label="Name" name="name" required />
          <Field label="Slug" name="slug" hint="Optional" />
          <Small>Create</Small>
        </form>
      </Card>
    </>
  );
}
