import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { centsToDollars } from "@/lib/format";
import { US_STATES } from "@/lib/us-states";
import { toShippingSettings } from "@/lib/data/site";
import { Card, Field, Notice, Save } from "../_components/ui";
import { saveShipping } from "./actions";

export const metadata: Metadata = { title: "Shipping" };

export default async function ShippingPage({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const db = await adminDb();
  const { data } = await db.from("shipping_settings").select("fixed_fee_states, fixed_fee, other_fee").eq("id", 1).maybeSingle();
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
        <Save />
      </form>
    </>
  );
}
