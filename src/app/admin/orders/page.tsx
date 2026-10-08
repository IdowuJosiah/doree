import type { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

const statuses = ["pending", "paid", "fulfilled", "cancelled"];
const labels: Record<string, string> = { pending: "Pending", paid: "Paid", fulfilled: "Fulfilled", cancelled: "Cancelled" };

export default async function OrdersPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  const db = await adminDb();
  let query = db.from("orders").select("id, number, name, email, total, status, created_at").order("created_at", { ascending: false }).limit(200);
  if (searchParams.status && statuses.includes(searchParams.status)) query = query.eq("status", searchParams.status);
  const q = searchParams.q?.replace(/[%,()]/g, " ").trim();
  if (q) query = /^\d+$/.test(q) ? query.eq("number", Number(q)) : query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
  const { data } = await query;

  return (
    <>
      <h1 className="mb-6 font-display text-4xl uppercase">Orders</h1>
      <form className="mb-6 flex flex-wrap items-end gap-3" role="search">
        <div>
          <label htmlFor="q" className="label mb-1 block">Search</label>
          <input id="q" name="q" defaultValue={searchParams.q} placeholder="Number, name or email" className="field !h-10" />
        </div>
        <div>
          <label htmlFor="status" className="label mb-1 block">Status</label>
          <select id="status" name="status" defaultValue={searchParams.status ?? ""} className="field !h-10">
            <option value="">All</option>
            {statuses.map((s) => <option key={s} value={s}>{labels[s]}</option>)}
          </select>
        </div>
        <button type="submit" className="btn-outline !min-h-[40px] !py-2">Filter</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="label border-b border-line">
            <tr><th className="py-2">Order</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((o) => (
              <tr key={o.id} className="border-b border-line">
                <td className="py-3"><Link href={`/admin/orders/${o.id}`} className="text-link">#{o.number}</Link></td>
                <td>{new Date(o.created_at).toLocaleDateString("en-US")}</td>
                <td>{o.name || o.email}<br /><span className="opacity-70">{o.email}</span></td>
                <td>{formatPrice(o.total)}</td>
                <td>{labels[o.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length === 0 && <p className="py-8">No orders found.</p>}
      </div>
    </>
  );
}
