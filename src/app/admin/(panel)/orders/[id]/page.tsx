import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Card, Notice, Save, Small, TextArea } from "../../_components/ui";
import { saveOrderNote, setOrderStatus } from "../actions";

export const metadata: Metadata = { title: "Order" };

const labels: Record<string, string> = { pending: "Pending", paid: "Paid", fulfilled: "Fulfilled", cancelled: "Cancelled" };

export default async function OrderPage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; saved?: string } }) {
  const db = await adminDb();
  const { data: o } = await db.from("orders").select("*, order_items(id, name, price, quantity)").eq("id", params.id).maybeSingle();
  if (!o) notFound();
  const a = o.address as { line1?: string; line2?: string; city?: string; state?: string; postalCode?: string };
  const next: Record<string, string[]> = { pending: ["cancelled"], paid: ["fulfilled", "cancelled"], fulfilled: ["paid", "cancelled"], cancelled: [] };

  return (
    <>
      <Link href="/admin/orders" className="text-link text-sm">← Orders</Link>
      <h1 className="mb-6 mt-2 font-display text-4xl uppercase">Order #{o.number}</h1>
      <Notice searchParams={searchParams} />

      <Card title="Items">
        <table className="w-full text-left text-sm">
          <tbody>
            {o.order_items.map((i: { id: string; name: string; price: number; quantity: number }) => (
              <tr key={i.id} className="border-b border-line">
                <td className="py-2">{i.name}</td>
                <td>× {i.quantity}</td>
                <td className="text-right">{formatPrice(i.price * i.quantity)}</td>
              </tr>
            ))}
            <tr><td className="pt-3" colSpan={2}>Subtotal</td><td className="pt-3 text-right">{formatPrice(o.subtotal)}</td></tr>
            <tr><td colSpan={2}>Shipping ({o.state})</td><td className="text-right">{formatPrice(o.shipping_fee)}</td></tr>
            <tr className="font-medium"><td colSpan={2}>Total</td><td className="text-right">{formatPrice(o.total)}</td></tr>
          </tbody>
        </table>
      </Card>

      <div className="grid gap-x-8 md:grid-cols-2">
        <Card title="Customer">
          <p>{o.name}</p>
          <p><a href={`mailto:${o.email}`} className="text-link">{o.email}</a></p>
          <p className="mt-1 text-sm opacity-70">{o.customer_id ? "Has an account" : "Guest checkout"}</p>
        </Card>
        <Card title="Shipping address">
          <p>{a.line1}</p>
          {a.line2 && <p>{a.line2}</p>}
          <p>{a.city}, {a.state} {a.postalCode}</p>
        </Card>
      </div>

      <Card title="Payment">
        <p>Square payment reference: {o.square_payment_id ?? "Not paid yet"}</p>
        <p className="text-sm opacity-70">Placed {new Date(o.created_at).toLocaleString("en-US")}</p>
      </Card>

      <Card title="Status" hint="Paid is set automatically when Square confirms the payment. Cancelling a paid order does not put stock back; adjust it under the product’s variants.">
        <p className="mb-4">Current status: <strong>{labels[o.status]}</strong></p>
        {next[o.status].length > 0 && (
          <form action={setOrderStatus.bind(null, o.id)} className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="status" className="label mb-1 block">Change to</label>
              <select id="status" name="status" className="field !h-10">
                {next[o.status].map((s) => <option key={s} value={s}>{labels[s]}</option>)}
              </select>
            </div>
            <Small>Update status</Small>
          </form>
        )}
      </Card>

      <Card title="Private note" hint="Only visible here, never to the customer.">
        <form action={saveOrderNote.bind(null, o.id)} className="max-w-xl space-y-4">
          <TextArea label="Note" name="note" defaultValue={o.note} />
          <Save>Save note</Save>
        </form>
      </Card>
    </>
  );
}
