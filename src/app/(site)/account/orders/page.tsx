import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };
export const dynamic = "force-dynamic";

const labels: Record<string, string> = { pending: "Awaiting payment", paid: "Paid", fulfilled: "Fulfilled", cancelled: "Cancelled" };
type Item = { name: string; quantity: number };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account/orders");
  // Row-level security returns only this customer's orders.
  const { data } = await createSessionClient()
    .from("orders")
    .select("id, number, created_at, total, status, order_items(name, quantity)")
    .neq("status", "pending")
    .order("created_at", { ascending: false });
  const orders = data ?? [];

  return (
    <section className="section container-page max-w-3xl">
      <Link href="/account" className="text-link text-sm">← Account</Link>
      <h1 className="display-xl mt-2">Orders</h1>
      {orders.length === 0 ? (
        <div className="mt-10">
          <p>You have no orders yet.</p>
          <Link href="/shop" className="btn-outline mt-6">Shop now</Link>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {orders.map((o) => (
            <li key={o.id} className="grid gap-1 py-5 sm:grid-cols-[1fr_auto] sm:gap-6">
              <div>
                <p className="font-display text-xl">Order #{o.number}</p>
                <p className="text-sm opacity-70">{new Date(o.created_at).toLocaleDateString("en-US", { dateStyle: "long" })}</p>
                <p className="mt-2 text-sm">{(o.order_items as Item[]).map((i) => `${i.name} × ${i.quantity}`).join(", ")}</p>
              </div>
              <div className="sm:text-right">
                <p>{formatPrice(o.total)}</p>
                <p className="label mt-1 text-gold-text">{labels[o.status] ?? o.status}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
