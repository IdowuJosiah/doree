import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Notice, Small } from "../_components/ui";
import { duplicateProduct, setArchived, setPublished } from "./actions";

export const metadata: Metadata = { title: "Products" };

type Row = {
  id: string;
  name: string;
  slug: string;
  price: number;
  published: boolean;
  sold_out: boolean;
  archived: boolean;
  best_seller: boolean;
  product_variants: { stock: number }[];
};

export default async function ProductsPage({ searchParams }: { searchParams: { q?: string; archived?: string; error?: string; saved?: string; published?: string; unpublished?: string } }) {
  const db = await adminDb();
  const showArchived = searchParams.archived === "1";
  let query = db
    .from("products")
    .select("id, name, slug, price, published, sold_out, archived, best_seller, product_variants(stock)")
    .eq("archived", showArchived)
    .order("created_at", { ascending: false });
  const q = searchParams.q?.replace(/[%,()]/g, " ").trim();
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  const { data } = await query.returns<Row[]>();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl uppercase">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">Add product</Link>
      </div>
      <div className="mt-6"><Notice searchParams={searchParams} /></div>
      <form className="mb-6 flex flex-wrap items-center gap-3" role="search">
        <label htmlFor="q" className="sr-only">Search products</label>
        <input id="q" name="q" defaultValue={searchParams.q} placeholder="Search by name or slug" className="field !h-10 max-w-xs" />
        {showArchived && <input type="hidden" name="archived" value="1" />}
        <button type="submit" className="btn-outline !min-h-[40px] !py-2">Search</button>
        <Link href={showArchived ? "/admin/products" : "/admin/products?archived=1"} className="text-link text-sm">
          {showArchived ? "Show active" : "Show archived"}
        </Link>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="label border-b border-line">
            <tr><th className="py-2">Name</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => {
              const stock = p.product_variants.reduce((s, v) => s + v.stock, 0);
              return (
                <tr key={p.id} className="border-b border-line">
                  <td className="py-3"><Link href={`/admin/products/${p.id}`} className="text-link">{p.name}</Link></td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{p.product_variants.length ? stock : "No variants"}</td>
                  <td>
                    {p.archived ? "Archived" : p.sold_out ? "Sold out" : p.published ? "Published" : "Draft"}
                    {p.best_seller && !p.archived && <span className="block text-xs text-olive">Best seller</span>}
                  </td>
                  <td className="flex justify-end gap-2 py-2">
                    {!p.archived && (
                      <form action={setPublished.bind(null, p.id, !p.published, "/admin/products")}><Small>{p.published ? "Unpublish" : "Publish"}</Small></form>
                    )}
                    <form action={duplicateProduct.bind(null, p.id)}><Small>Duplicate</Small></form>
                    <form action={setArchived.bind(null, p.id, !p.archived)}><Small>{p.archived ? "Restore" : "Archive"}</Small></form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data?.length === 0 && <p className="py-8">No products found.</p>}
      </div>
    </>
  );
}
