import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { shopDate } from "@/lib/shop-time";
import { Card } from "../_components/ui";

export const metadata: Metadata = { title: "Subscribers" };

const sources: Record<string, string> = { coming_soon: "Coming soon", newsletter: "Newsletter" };

type Customer = { email: string; name: string; orders: number; spent: number; last: string };

/** One row per customer email, from paid and sent orders (not unpaid or cancelled). */
function customersFrom(orders: { email: string; name: string; total: number; created_at: string }[]): Customer[] {
  const byEmail = new Map<string, Customer>();
  for (const o of orders) {
    const key = o.email.trim().toLowerCase();
    const c = byEmail.get(key);
    if (c) {
      c.orders += 1;
      c.spent += o.total;
      if (o.created_at > c.last) {
        c.last = o.created_at;
        c.name = o.name || c.name;
      }
    } else {
      byEmail.set(key, { email: key, name: o.name, orders: 1, spent: o.total, last: o.created_at });
    }
  }
  return [...byEmail.values()].sort((a, b) => b.last.localeCompare(a.last));
}

export default async function SubscribersPage() {
  const db = await adminDb();
  const [{ data, count }, { data: orderRows }] = await Promise.all([
    db.from("subscribers").select("email, source, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(1000),
    db.from("orders").select("email, name, total, created_at").in("status", ["paid", "fulfilled"]).limit(5000),
  ]);
  const list = data ?? [];
  const customers = customersFrom(orderRows ?? []);

  return (
    <>
      <h1 className="font-display text-4xl uppercase">Subscribers</h1>
      <p className="mb-8 mt-2 max-w-2xl">Everyone who signed up for news, and everyone who has bought from the shop.</p>

      <Card title="Signed up for news" hint={`${count ?? 0} ${count === 1 ? "person" : "people"} signed up on the site (launch teaser, Coming soon or newsletter). They asked to hear from Dorée, so they are the list for announcements.`}>
        {list.length === 0 ? (
          <p className="text-sm">No sign-ups yet.</p>
        ) : (
          <>
            <label htmlFor="all-emails" className="label mb-1 block">All emails, ready to copy</label>
            <textarea id="all-emails" readOnly rows={3} value={list.map((s) => s.email).join(", ")} className="field !h-auto mb-8 py-2 text-sm" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="label border-b border-line">
                  <tr><th className="py-2">Email</th><th>Signed up from</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr key={s.email} className="border-b border-line">
                      <td className="py-2">{s.email}</td>
                      <td>{sources[s.source] ?? s.source}</td>
                      <td>{shopDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card
        title="Customers"
        hint={`${customers.length} ${customers.length === 1 ? "person has" : "people have"} placed a paid order. They did not sign up for news, so use these for order matters, or include an easy way to unsubscribe if you send them offers.`}
      >
        {customers.length === 0 ? (
          <p className="text-sm">No paid orders yet.</p>
        ) : (
          <>
            <label htmlFor="customer-emails" className="label mb-1 block">All customer emails, ready to copy</label>
            <textarea id="customer-emails" readOnly rows={3} value={customers.map((c) => c.email).join(", ")} className="field !h-auto mb-8 py-2 text-sm" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="label border-b border-line">
                  <tr><th className="py-2">Name</th><th>Email</th><th>Orders</th><th>Spent</th><th>Last order</th></tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.email} className="border-b border-line">
                      <td className="py-2">{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.orders}</td>
                      <td>{formatPrice(c.spent)}</td>
                      <td>{shopDate(c.last)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
