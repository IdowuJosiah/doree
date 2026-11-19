import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { centsToDollars } from "@/lib/format";
import { US_STATES } from "@/lib/us-states";
import { toShippingSettings, type ShippingRow } from "@/lib/data/site";
import { Card, Check, Field, Notice, Save, TextArea } from "../_components/ui";
import { saveShipping } from "./actions";

export const metadata: Metadata = { title: "Shipping" };

export default async function ShippingPage(props: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const searchParams = await props.searchParams;
  const db = await adminDb();
  const { data } = await db.from("shipping_settings").select("*").eq("id", 1).maybeSingle<ShippingRow>();
  const s = toShippingSettings(data);
  const selected = new Set(s.fixedFeeStates);

  return (
    <>
      <h1 className="mb-6 font-display text-4xl uppercase">Shipping</h1>
      <Notice searchParams={searchParams} />
      <form action={saveShipping}>
        <Card title="Fees" hint="Checkout applies the fixed fee to the states ticked below and the additional fee to every other state. Amounts are in US dollars.">
          <div className="grid max-w-md gap-5 sm:grid-cols-2">
            <Field label="Fixed fee (USD)" name="fixed_fee" type="number" step="0.01" defaultValue={centsToDollars(s.fixedFee)} required />
            <Field label="Additional fee (USD)" name="other_fee" type="number" step="0.01" defaultValue={centsToDollars(s.otherFee)} required />
          </div>
          <div className="mt-5 max-w-md">
            <Field
              label="Free shipping on orders from (USD)"
              name="free_shipping_min"
              type="number"
              step="0.01"
              defaultValue={s.freeShippingMin === null ? "" : centsToDollars(s.freeShippingMin)}
              hint="Counted after any discount code. Leave empty to turn free shipping off."
            />
          </div>
        </Card>
        <Card title="Fixed-fee states">
          <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-4">
            {US_STATES.map((st) => (
              <li key={st.code}>
                <label className="flex min-h-[44px] items-center gap-3">
                  <input type="checkbox" name="states" value={st.code} defaultChecked={selected.has(st.code)} className="h-4 w-4 accent-[var(--gold-text)]" />
                  {st.name}
                </label>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Local pickup" hint="Free pickup instead of shipping. Only customers whose ZIP code is listed can choose it at checkout. Pickup orders are marked Pickup under Orders.">
          <div className="max-w-xl space-y-4">
            <Check label="Offer local pickup at checkout" name="pickup_enabled" defaultChecked={Boolean(data?.pickup_enabled ?? true)} />
            <Field label="Pickup ZIP codes" name="pickup_zips" defaultValue={(data?.pickup_zips ?? []).join(", ")} hint="Five-digit ZIP codes, separated by commas." />
            <TextArea label="Note shown under Local pickup at checkout" name="pickup_note" rows={3} defaultValue={data?.pickup_note ?? ""} />
            {!s.pickupEnabled && data?.pickup_enabled && <p className="text-sm text-red-800">Add at least one ZIP code, or pickup will not show at checkout.</p>}
          </div>
        </Card>
        <Save />
      </form>
    </>
  );
}
