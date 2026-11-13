import type { Metadata } from "next";
import { adminDb } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { Card, Field, Notice, Small } from "../_components/ui";
import { createDiscount, deleteDiscount, setDiscountActive } from "./actions";

export const metadata: Metadata = { title: "Discounts" };

type Code = {
  id: string;
  code: string;
  percent: number;
  active: boolean;
  ends_at: string | null;
  max_uses: number | null;
  uses: number;
  min_subtotal: number;
};

function status(c: Code) {
  if (!c.active) return { label: "Off", cls: "opacity-60" };
  if (c.ends_at && new Date(c.ends_at) < new Date()) return { label: "Expired", cls: "opacity-60" };
  if (c.max_uses !== null && c.uses >= c.max_uses) return { label: "Used up", cls: "opacity-60" };
  return { label: "Active", cls: "text-gold-text" };
}

export default async function DiscountsPage(props: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const searchParams = await props.searchParams;
  const db = await adminDb();
  const { data, error } = await db
    .from("discount_codes")
    .select("id, code, percent, active, ends_at, max_uses, uses, min_subtotal")
    .order("created_at", { ascending: false })
    .returns<Code[]>();
  const missing = Boolean(error);

  return (
    <>
      <h1 className="font-display text-4xl uppercase">Discounts</h1>
      <p className="mb-6 mt-2 max-w-2xl">
        Codes customers type at checkout for a percentage off their order. The discount comes off the products, not shipping. A code&apos;s use is counted when an order with it is paid.
      </p>
      <Notice searchParams={searchParams} />

      {missing && (
        <p role="alert" className="mb-6 border border-red-800 px-4 py-3 text-sm text-red-800">
          Discount codes need a one-time database update: run <code>supabase/migrations/0007_discount_codes.sql</code> in the Supabase SQL editor, then reload this page.
        </p>
      )}

      <Card title="Create a code">
        <form action={createDiscount} className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Field label="Code" name="code" required hint="What customers type, e.g. GOLDEN15. Letters and numbers, no spaces." />
          <Field label="Percent off" name="percent" type="number" required hint="1 to 100" />
          <Field label="Ends on (optional)" name="ends_at" type="date" hint="Works until the end of that day (US Eastern time). Empty: no end." />
          <Field label="Usage limit (optional)" name="max_uses" type="number" hint="How many paid orders can use it. Empty: unlimited." />
          <Field label="Minimum order (optional)" name="min_subtotal" type="number" step="0.01" hint="In dollars, before shipping. Empty: none." />
          <div className="sm:col-span-2"><button type="submit" className="btn-primary">Create code</button></div>
        </form>
      </Card>

      {!missing && (
        <Card title="Your codes">
          {(data ?? []).length === 0 ? (
            <p className="text-sm">No codes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="label border-b border-line">
                  <tr><th className="py-2">Code</th><th>Off</th><th>Used</th><th>Ends</th><th>Minimum</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {(data ?? []).map((c) => {
                    const st = status(c);
                    return (
                      <tr key={c.id} className="border-b border-line align-middle">
                        <td className="py-3 font-medium tracking-wide">{c.code}</td>
                        <td>{c.percent}%</td>
                        <td>{c.uses}{c.max_uses !== null && ` of ${c.max_uses}`}</td>
                        <td>{c.ends_at ? new Date(c.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                        <td>{c.min_subtotal ? formatPrice(c.min_subtotal) : "—"}</td>
                        <td className={st.cls}>{st.label}</td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <form action={setDiscountActive.bind(null, c.id, !c.active)}><Small>{c.active ? "Turn off" : "Turn on"}</Small></form>
                            <form action={deleteDiscount.bind(null, c.id)}><Small danger>Delete</Small></form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </>
  );
}
