import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { LOW_STOCK, stockLevel, type StockLevel } from "@/lib/inventory";
import { Notice } from "../_components/ui";
import { saveStock } from "./actions";

export const metadata: Metadata = { title: "Inventory" };

type Row = {
  id: string;
  label: string;
  sku: string | null;
  stock: number;
  products: { id: string; name: string; price: number; published: boolean; archived: boolean } | null;
};

const levelLabel: Record<StockLevel, string> = { out: "Out of stock", low: "Low", ok: "In stock" };
const levelClass: Record<StockLevel, string> = { out: "text-red-800", low: "text-gold-text font-medium", ok: "opacity-70" };

const filters = [
  { value: "", label: "All" },
  { value: "low", label: `Low (${LOW_STOCK} or fewer)` },
  { value: "out", label: "Out of stock" },
];

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { q?: string; show?: string; error?: string; saved?: string };
}) {
  const db = await adminDb();
  const { data } = await db
    .from("product_variants")
    .select("id, label, sku, stock, products!inner(id, name, price, published, archived)")
    .eq("products.archived", false)
    .returns<Row[]>();

  const all = (data ?? [])
    .filter((r) => r.products)
    .sort((a, b) => a.products!.name.localeCompare(b.products!.name) || a.label.localeCompare(b.label, undefined, { numeric: true }));

  const units = all.reduce((s, r) => s + r.stock, 0);
  const value = all.reduce((s, r) => s + r.stock * r.products!.price, 0);
  const outCount = all.filter((r) => stockLevel(r.stock) === "out").length;
  const lowCount = all.filter((r) => stockLevel(r.stock) === "low").length;

  const q = searchParams.q?.trim().toLowerCase() ?? "";
  const show = searchParams.show ?? "";
  const rows = all.filter((r) => {
    const level = stockLevel(r.stock);
    if (show === "out" && level !== "out") return false;
    if (show === "low" && level === "ok") return false;
    if (q && !`${r.products!.name} ${r.label} ${r.sku ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const params = new URLSearchParams();
  if (searchParams.q) params.set("q", searchParams.q);
  if (show) params.set("show", show);
  const returnTo = `/admin/inventory${params.size ? `?${params}` : ""}`;

  return (
    <>
      <h1 className="font-display text-4xl uppercase">Inventory</h1>
      <p className="mt-2 text-sm opacity-70">Stock drops automatically when an order is paid. Change any count below and save.</p>

      <ul className="my-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <li className="border border-line p-5"><p className="label">Units in stock</p><p className="font-display text-3xl">{units}</p></li>
        <li className="border border-line p-5"><p className="label">Stock value</p><p className="font-display text-3xl">{formatPrice(value)}</p><p className="text-xs opacity-70">at selling price</p></li>
        <li className="border border-line p-5">
          <p className="label">Low stock</p><p className="font-display text-3xl text-gold-text">{lowCount}</p>
          <Link href="/admin/inventory?show=low" className="text-link text-sm">Show</Link>
        </li>
        <li className="border border-line p-5">
          <p className="label">Out of stock</p><p className="font-display text-3xl text-red-800">{outCount}</p>
          <Link href="/admin/inventory?show=out" className="text-link text-sm">Show</Link>
        </li>
      </ul>

      <Notice searchParams={searchParams} />

      <form className="mb-6 flex flex-wrap items-end gap-3" role="search">
        <div>
          <label htmlFor="q" className="label mb-1 block">Search</label>
          <input id="q" name="q" defaultValue={searchParams.q} placeholder="Product, variant or SKU" className="field !h-10" />
        </div>
        <div>
          <label htmlFor="show" className="label mb-1 block">Show</label>
          <select id="show" name="show" defaultValue={show} className="field !h-10">
            {filters.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-outline !min-h-[40px] !py-2">Filter</button>
      </form>

      {rows.length === 0 ? (
        <p className="py-8">{all.length === 0 ? "No variants yet. Add them on each product’s page." : "Nothing matches this filter."}</p>
      ) : (
        <form action={saveStock.bind(null, returnTo)}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="label border-b border-line">
                <tr><th className="py-2">Product</th><th>Variant</th><th>SKU</th><th>Status</th><th className="w-28">Stock</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const level = stockLevel(r.stock);
                  return (
                    <tr key={r.id} className="border-b border-line">
                      <td className="py-2">
                        <Link href={`/admin/products/${r.products!.id}`} className="text-link">{r.products!.name}</Link>
                        {!r.products!.published && <span className="ml-2 text-xs opacity-70">Draft</span>}
                      </td>
                      <td>{r.label}</td>
                      <td className="opacity-70">{r.sku ?? "—"}</td>
                      <td className={levelClass[level]}>{levelLabel[level]}</td>
                      <td>
                        <input type="hidden" name={`orig:${r.id}`} value={r.stock} />
                        <label htmlFor={`stock-${r.id}`} className="sr-only">Stock for {r.products!.name}, {r.label}</label>
                        <input id={`stock-${r.id}`} name={`stock:${r.id}`} type="number" min={0} step={1} defaultValue={r.stock} className="field !h-10 w-24" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="sticky bottom-0 mt-4 border-t border-line bg-cream py-4">
            <button type="submit" className="btn-primary">Save stock changes</button>
          </div>
        </form>
      )}
    </>
  );
}
