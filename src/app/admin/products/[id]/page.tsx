import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { centsToDollars } from "@/lib/format";
import { Card, Check, Field, Notice, Save, Small, TextArea } from "../../_components/ui";
import { FocusPicker } from "../../_components/FocusPicker";
import { ImageUploader } from "../../_components/ImageUploader";
import { addImages, addVariant, deleteImage, deleteVariant, moveImage, saveImage, saveProduct, saveVariant } from "../actions";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; saved?: string };
}) {
  const db = await adminDb();
  const { data: p } = await db.from("products").select("*").eq("id", params.id).maybeSingle();
  if (!p) notFound();

  const [{ data: variants }, { data: images }, { data: collections }, { data: member }] = await Promise.all([
    db.from("product_variants").select("id, label, stock, sku").eq("product_id", p.id).order("label"),
    db.from("product_images").select("id, url, alt, object_position, sort_order").eq("product_id", p.id).order("sort_order"),
    db.from("collections").select("id, name").order("sort_order"),
    db.from("collection_products").select("collection_id").eq("product_id", p.id),
  ]);
  const inCollections = new Set((member ?? []).map((m) => m.collection_id as string));

  return (
    <>
      <Link href="/admin/products" className="text-link text-sm">← Products</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl uppercase">{p.name}</h1>
      <Notice searchParams={searchParams} />

      <Card title="Details">
        <form action={saveProduct.bind(null, p.id)} className="grid max-w-2xl gap-5">
          <Field label="Name" name="name" defaultValue={p.name} required />
          <Field label="Slug" name="slug" defaultValue={p.slug} required />
          <Field label="Price (USD)" name="price" type="number" step="0.01" defaultValue={centsToDollars(p.price)} required />
          <TextArea label="Description" name="description" defaultValue={p.description} />
          <TextArea label="Materials" name="materials" defaultValue={p.materials} rows={2} />
          <TextArea label="Care" name="care" defaultValue={p.care} rows={2} />
          <fieldset>
            <legend className="label mb-1">Collections</legend>
            {(collections ?? []).map((c) => (
              <label key={c.id} className="flex min-h-[44px] items-center gap-3">
                <input type="checkbox" name="collections" value={c.id} defaultChecked={inCollections.has(c.id)} className="h-4 w-4 accent-[var(--olive)]" />
                {c.name}
              </label>
            ))}
          </fieldset>
          <Check label="Published (visible on the shop)" name="published" defaultChecked={p.published} />
          <Check label="Sold out" name="sold_out" defaultChecked={p.sold_out} />
          <Check label="Best seller (shown on the home page, up to four)" name="best_seller" defaultChecked={p.best_seller} />
          <div><Save /></div>
        </form>
      </Card>

      <Card title="Variants and stock" hint="Stock drops automatically when an order is paid. A product needs at least one variant to be bought; use “One size” if it has no options.">
        <div className="space-y-3">
          {(variants ?? []).map((v) => (
            <div key={v.id} className="flex flex-wrap items-end gap-3">
              <form action={saveVariant.bind(null, p.id, v.id)} className="flex flex-wrap items-end gap-3">
                <Field label="Label" name="label" defaultValue={v.label} required />
                <Field label="Stock" name="stock" type="number" defaultValue={v.stock} />
                <Field label="SKU" name="sku" defaultValue={v.sku ?? ""} />
                <Small>Save</Small>
              </form>
              <form action={deleteVariant.bind(null, p.id, v.id)}><Small danger>Delete</Small></form>
            </div>
          ))}
        </div>
        <form action={addVariant.bind(null, p.id)} className="mt-6 flex flex-wrap items-end gap-3 border-t border-line pt-6">
          <Field label="New variant" name="label" required />
          <Field label="Stock" name="stock" type="number" defaultValue={0} />
          <Field label="SKU" name="sku" />
          <Small>Add variant</Small>
        </form>
      </Card>

      <Card title="Images" hint="The first image is the main photo. Every image needs alt text. Click a photo to set the focus point the arch crop keeps in view. Originals are kept; the site serves resized copies.">
        <ul className="space-y-8">
          {(images ?? []).map((img, i) => (
            <li key={img.id} className="border-b border-line pb-8">
              <form action={saveImage.bind(null, p.id, img.id)} className="space-y-4">
                <FocusPicker src={img.url} initial={img.object_position} />
                <Field label="Alt text" name="alt" defaultValue={img.alt} required />
                <Small>Save image</Small>
              </form>
              <div className="mt-3 flex gap-2">
                {i > 0 && <form action={moveImage.bind(null, p.id, img.id, "up")}><Small>Move earlier</Small></form>}
                {i < (images?.length ?? 0) - 1 && <form action={moveImage.bind(null, p.id, img.id, "down")}><Small>Move later</Small></form>}
                <form action={deleteImage.bind(null, p.id, img.id)}><Small danger>Delete</Small></form>
              </div>
            </li>
          ))}
        </ul>
        {images?.length === 0 && <p className="mb-4 text-sm">No images yet.</p>}
        <ImageUploader folder={`products/${p.id}`} multiple onUploaded={addImages.bind(null, p.id)} />
      </Card>
    </>
  );
}
