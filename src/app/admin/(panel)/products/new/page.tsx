import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { Field, Notice, TextArea } from "../../_components/ui";
import { createProduct } from "../actions";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage({ searchParams }: { searchParams: { error?: string } }) {
  await adminDb();
  return (
    <>
      <h1 className="font-display text-4xl uppercase">New product</h1>
      <div className="mt-6 max-w-xl"><Notice searchParams={searchParams} /></div>
      <form action={createProduct} className="max-w-xl space-y-5">
        <Field label="Name" name="name" required />
        <Field label="Slug" name="slug" hint="Used in the product address. Leave blank to use the name." />
        <Field label="Price (USD)" name="price" type="number" step="0.01" required />
        <Field label="Stock" name="stock" type="number" defaultValue={0} hint="How many you have. If the piece comes in sizes or lengths, add them on the next screen." />
        <TextArea label="Description" name="description" />
        <p className="text-sm opacity-70">You can add photos, sizes and more details on the next screen.</p>
        <div className="flex flex-wrap gap-3">
          <button type="submit" name="intent" value="publish" className="btn-primary">Publish now</button>
          <button type="submit" name="intent" value="draft" className="btn-outline">Save as draft</button>
        </div>
      </form>
    </>
  );
}
