import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Card, Check, Field, Notice, Save, Small, TextArea } from "../../_components/ui";
import { saveOrderNote, saveTracking, setOrderStatus } from "../actions";
import { uspsTrackingUrl } from "@/lib/tracking";

export const metadata: Metadata = { title: "Order" };

const labels: Record<string, string> = { pending: "Pending", paid: "Paid", fulfilled: "Fulfilled", cancelled: "Cancelled" };

export default async function OrderPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string; emailed?: string; restocked?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const db = await adminDb();
  const { data: o } = await db.from("orders").select("*, order_items(id, name, price, quantity)").eq("id", params.id).maybeSingle();
  if (!o) notFound();
  const a = o.address as { line1?: string; line2?: string; city?: string; state?: string; postalCode?: string };
  const pickup = o.fulfillment === "pickup";
  const optionLabel = (s: string) => (pickup && s === "fulfilled" ? "Fulfilled (ready for pickup)" : labels[s]);
  const next: Record<string, string[]> = { pending: ["cancelled"], paid: ["fulfilled", "cancelled"], fulfilled: ["paid", "cancelled"], cancelled: [] };

  return (
    <>
      <Link href="/admin/orders" className="text-link text-sm">← Orders</Link>
      <h1 className="mt-2 font-display text-4xl uppercase">Order #{o.number}</h1>
      <p className="label mb-6 mt-2 text-gold-text">{pickup ? "Local pickup" : "Ship to customer"}</p>
      <Notice searchParams={searchParams} />
      {searchParams.emailed === "1" && (
        <p role="status" className="-mt-3 mb-6 text-sm text-gold-text">{o.email} has been emailed that the order is {pickup ? "ready for pickup" : "on its way"}.</p>
      )}
      {searchParams.restocked === "1" && (
        <p role="status" className="-mt-3 mb-6 text-sm text-gold-text">Order cancelled and its items put back in stock. Remember to refund the customer in Square if you have not already.</p>
      )}
      {searchParams.emailed === "0" && (
        <p role="alert" className="-mt-3 mb-6 text-sm text-red-800">The {pickup ? "“ready for pickup”" : "“on its way”"} email could not be sent. Check the email settings, or write to {o.email} directly.</p>
      )}

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
            {o.discount_amount > 0 && (
              <tr className="text-gold-text"><td colSpan={2}>Discount ({o.discount_code})</td><td className="text-right">−{formatPrice(o.discount_amount)}</td></tr>
            )}
            {pickup ? (
              <tr><td colSpan={2}>Local pickup</td><td className="text-right">Free</td></tr>
            ) : (
              <tr><td colSpan={2}>Shipping ({o.state})</td><td className="text-right">{formatPrice(o.shipping_fee)}</td></tr>
            )}
            <tr className="font-medium"><td colSpan={2}>Total</td><td className="text-right">{formatPrice(o.total)}</td></tr>
          </tbody>
        </table>
      </Card>

      <div className="grid gap-x-8 lg:grid-cols-2">
        <Card title="Customer">
          <p>{o.name}</p>
          <p><a href={`mailto:${o.email}`} className="text-link">{o.email}</a></p>
          <p className="mt-1 text-sm opacity-70">{o.customer_id ? "Has an account" : "Guest checkout"}</p>
        </Card>
        {pickup ? (
          <Card title="Local pickup">
            <p>Customer ZIP code: {a.postalCode}</p>
            <p className="mt-1 text-sm opacity-70">When it is ready, mark the order Fulfilled and write the pickup location and time in the message. The customer gets a “ready for pickup” email.</p>
          </Card>
        ) : (
          <Card title="Shipping address">
            <p>{a.line1}</p>
            {a.line2 && <p>{a.line2}</p>}
            <p>{a.city}, {a.state} {a.postalCode}</p>
          </Card>
        )}
      </div>

      <Card title="Payment">
        <p>Square payment reference: {o.square_payment_id ?? "Not paid yet"}</p>
        <p className="text-sm opacity-70">Placed {new Date(o.created_at).toLocaleString("en-US")}</p>
      </Card>

      <Card title="Status" hint="Paid is set automatically when Square confirms the payment. Cancelling a paid or sent order puts its stock back automatically. It does not refund the customer: refund in Square first.">
        <p className="mb-4">Current status: <strong>{labels[o.status]}</strong></p>
        {next[o.status].length > 0 && (
          <form action={setOrderStatus.bind(null, o.id)} className="max-w-xl space-y-4">
            <div>
              <label htmlFor="status" className="label mb-1 block">Change to</label>
              <select id="status" name="status" className="field !h-10 !w-auto">
                {next[o.status].map((s) => <option key={s} value={s}>{optionLabel(s)}</option>)}
              </select>
            </div>
            {o.status === "paid" && pickup && (
              <div>
                <TextArea label="Pickup location and time" name="customer_message" rows={3} />
                <p className="mt-1 text-xs opacity-70">
                  Marking the order Fulfilled emails {o.email} that it is ready for pickup, with what you write here.
                </p>
              </div>
            )}
            {o.status === "paid" && !pickup && (
              <>
                <Field label="USPS tracking number (optional)" name="tracking_number" defaultValue={o.tracking_number ?? ""} hint="From the USPS label or receipt. Customers get a Track your package button." />
                <div>
                  <TextArea label="Message to the customer (optional)" name="customer_message" rows={3} />
                  <p className="mt-1 text-xs opacity-70">
                    Marking the order Fulfilled emails {o.email} that it is on its way, with the tracking link and anything written here.
                  </p>
                </div>
              </>
            )}
            <Small>Update status</Small>
          </form>
        )}
      </Card>

      {o.status === "fulfilled" && !pickup && (
        <Card title="USPS tracking" hint="Add or correct the tracking number at any time. Customers see it in their emails, under My orders and on the Track my order page.">
          {o.tracking_number && (
            <p className="mb-4 text-sm">
              Current: <strong className="tracking-wide">{o.tracking_number}</strong>{" "}
              <a href={uspsTrackingUrl(o.tracking_number)} target="_blank" rel="noopener noreferrer" className="text-link">Open on USPS ↗</a>
            </p>
          )}
          <form action={saveTracking.bind(null, o.id)} className="max-w-xl space-y-4">
            <Field label="USPS tracking number" name="tracking_number" defaultValue={o.tracking_number ?? ""} hint="Leave empty and save to remove it." />
            <Check label="Email the customer the tracking link" name="email_customer" defaultChecked={!o.tracking_number} />
            <Small>Save tracking</Small>
          </form>
        </Card>
      )}

      <Card title="Private note" hint="Only visible here, never to the customer.">
        <form action={saveOrderNote.bind(null, o.id)} className="max-w-xl space-y-4">
          <TextArea label="Note" name="note" defaultValue={o.note} />
          <Save>Save note</Save>
        </form>
      </Card>
    </>
  );
}
