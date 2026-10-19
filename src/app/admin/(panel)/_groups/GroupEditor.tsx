import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { Card, Field, Notice, Save, Small, TextArea } from "../_components/ui";
import { ImageUploader } from "../_components/ImageUploader";
import { addProductToGroup, clearGroupBanner, deleteGroup, moveGroupProduct, removeProductFromGroup, saveGroup, setGroupBanner } from "./actions";
import { KINDS, type GroupKind } from "./kinds";

export async function GroupEditor({ kind, id, searchParams }: { kind: GroupKind; id: string; searchParams: { error?: string; saved?: string } }) {
  const k = KINDS[kind];
  const db = await adminDb();
  const { data: c } = await db.from("collections").select("*").eq("id", id).eq("kind", kind).maybeSingle();
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
      <Link href={k.path} className="text-link text-sm">← {k.plural}</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl uppercase">{c.name}</h1>
      <Notice searchParams={searchParams} />

      <Card title="Details">
        <form action={saveGroup.bind(null, kind, c.id)} className="grid max-w-xl gap-5">
          <Field label="Name" name="name" defaultValue={c.name} required />
          <Field label="Web address" name="slug" defaultValue={c.slug} required hint={`The page is at ${k.publicPath}/${c.slug}`} />
          <TextArea label="Intro line" name="intro" defaultValue={c.intro} rows={2} />
          <Field label={`Order in the ${k.singular} list`} name="sort_order" type="number" defaultValue={c.sort_order} />
          <div className="flex flex-wrap items-center gap-4">
            <Save />
            <Link href={`${k.publicPath}/${c.slug}`} className="text-link text-sm" target="_blank">View on the shop</Link>
          </div>
        </form>
      </Card>

      <Card title="Banner image" hint={`Shown full width at the top of the ${k.singular} page, as tall as the home page hero. A wide landscape photo works best.`}>
        {c.banner_url && (
          <div className="mb-4 flex items-end gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.banner_url} alt="" className="max-h-40 w-auto" />
            <form action={clearGroupBanner.bind(null, kind, c.id)}><Small danger>Remove</Small></form>
          </div>
        )}
        <ImageUploader folder={`collections/${c.id}`} onUploaded={setGroupBanner.bind(null, c.id)} label={c.banner_url ? "Replace banner" : "Upload banner"} />
      </Card>

      <Card
        title="Products and their order"
        hint={kind === "category" ? "A product has one category; adding it here moves it out of its current one." : "Products can be in more than one collection."}
      >
        <ol className="divide-y divide-line border-y border-line">
          {members.map((m, i) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{i + 1}. {m.name}</span>
              <span className="flex gap-2">
                {i > 0 && <form action={moveGroupProduct.bind(null, kind, c.id, m.id, "up")}><Small>Up</Small></form>}
                {i < members.length - 1 && <form action={moveGroupProduct.bind(null, kind, c.id, m.id, "down")}><Small>Down</Small></form>}
                <form action={removeProductFromGroup.bind(null, kind, c.id, m.id)}><Small danger>Remove</Small></form>
              </span>
            </li>
          ))}
        </ol>
        {members.length === 0 && <p className="text-sm">No products yet.</p>}
        {addable.length > 0 && (
          <form action={addProductToGroup.bind(null, kind, c.id)} className="mt-6 flex flex-wrap items-end gap-3">
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

      <Card title={`Delete ${k.singular}`} hint={`Products are kept; they just leave this ${k.singular}.`}>
        <form action={deleteGroup.bind(null, kind, c.id)}><Small danger>Delete {k.singular}</Small></form>
      </Card>
    </>
  );
}
