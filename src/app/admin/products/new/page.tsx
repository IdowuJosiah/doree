import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { Field, Notice, Save, TextArea } from "../../_components/ui";
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
        <TextArea label="Description" name="description" />
        <p className="text-sm opacity-70">Add variants, stock and photos on the next screen. New products start as drafts.</p>
        <Save>Create product</Save>
      </form>
    </>
  );
}
