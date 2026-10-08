import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { Card, Field, Notice, Save, Small, TextArea } from "../../_components/ui";
import { ImageUploader } from "../../_components/ImageUploader";
import { addProductToCollection, clearBanner, deleteCollection, moveProduct, removeProductFromCollection, saveCollection, setBanner } from "../actions";

export const metadata: Metadata = { title: "Edit collection" };

export default async function EditCollectionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; saved?: string };
}) {
  const db = await adminDb();
  const { data: c } = await db.from("collections").select("*").eq("id", params.id).maybeSingle();
  if (!c) notFound();

  const [{ data: links }, { data: all }] = await Promise.all([
    db.from("collection_products").select("sort_order, products(id, name)").eq("collection_id", c.id).order("sort_order"),
    db.from("products").select("id, name").eq("archived", false).order("name"),
  ]);
  const members = (links ?? []).flatMap((l) => {
    const p = l.products as unknown as { id: string; name: string } | null;
    return p ? [p] : [];
  });
  const memberIds = new Set(members.map((m) => m.id));
  const addable = (all ?? []).filter((p) => !memberIds.has(p.id));

  return (
    <>
      <Link href="/admin/collections" className="text-link text-sm">← Collections</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl uppercase">{c.name}</h1>
      <Notice searchParams={searchParams} />

      <Card title="Details">
        <form action={saveCollection.bind(null, c.id)} className="grid max-w-xl gap-5">
          <Field label="Name" name="name" defaultValue={c.name} required />
          <Field label="Slug" name="slug" defaultValue={c.slug} required />
          <TextArea label="Intro line" name="intro" defaultValue={c.intro} rows={2} />
          <Field label="Order in the collection list" name="sort_order" type="number" defaultValue={c.sort_order} />
          <div><Save /></div>
        </form>
      </Card>

      <Card title="Banner image">
        {c.banner_url && (
          <div className="mb-4 flex items-end gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.banner_url} alt="" className="max-h-40 w-auto" />
            <form action={clearBanner.bind(null, c.id)}><Small danger>Remove</Small></form>
          </div>
        )}
        <ImageUploader folder={`collections/${c.id}`} onUploaded={setBanner.bind(null, c.id)} label={c.banner_url ? "Replace banner" : "Upload banner"} />
      </Card>

      <Card title="Products and their order">
        <ol className="divide-y divide-line border-y border-line">
          {members.map((m, i) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{i + 1}. {m.name}</span>
              <span className="flex gap-2">
                {i > 0 && <form action={moveProduct.bind(null, c.id, m.id, "up")}><Small>Up</Small></form>}
                {i < members.length - 1 && <form action={moveProduct.bind(null, c.id, m.id, "down")}><Small>Down</Small></form>}
                <form action={removeProductFromCollection.bind(null, c.id, m.id)}><Small danger>Remove</Small></form>
              </span>
            </li>
          ))}
        </ol>
        {members.length === 0 && <p className="text-sm">No products yet.</p>}
        {addable.length > 0 && (
          <form action={addProductToCollection.bind(null, c.id)} className="mt-6 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="product_id" className="label mb-1 block">Add a product</label>
              <select id="product_id" name="product_id" className="field !h-10">
                {addable.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <Small>Add</Small>
          </form>
        )}
      </Card>

      <Card title="Delete collection" hint="Products are kept; they just leave this collection.">
        <form action={deleteCollection.bind(null, c.id)}><Small danger>Delete collection</Small></form>
      </Card>
    </>
  );
}
