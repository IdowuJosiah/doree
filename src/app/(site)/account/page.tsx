import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { US_STATES } from "@/lib/us-states";
import { signOut } from "../login/actions";
import { saveDetails } from "./actions";

export const metadata: Metadata = { title: "Account", robots: { index: false } };
export const dynamic = "force-dynamic";

type Address = { line1?: string; line2?: string; city?: string; state?: string; postalCode?: string };

export default async function AccountPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const { data: customer } = await createSessionClient().from("customers").select("name, address").eq("id", user.id).maybeSingle();
  const a = (customer?.address ?? {}) as Address;
  const field = (label: string, name: string, value?: string, autoComplete?: string) => (
    <div>
      <label htmlFor={name} className="label mb-1 block">{label}</label>
      <input id={name} name={name} defaultValue={value ?? ""} autoComplete={autoComplete} className="field" />
    </div>
  );

  return (
    <section className="section container-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="script-line">Welcome{customer?.name ? `, ${customer.name.split(" ")[0]}` : ""}</p>
          <h1 className="display-xl">Account</h1>
        </div>
        <form action={signOut}><button type="submit" className="btn-outline">Sign out</button></form>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        <li><Link href="/account/orders" className="block border border-line p-6 hover:border-ink"><span className="font-display text-2xl">Orders</span><span className="mt-1 block text-sm">Your order history and status</span></Link></li>
        <li><Link href="/account/wishlist" className="block border border-line p-6 hover:border-ink"><span className="font-display text-2xl">Wishlist</span><span className="mt-1 block text-sm">The pieces you have saved</span></Link></li>
      </ul>

      <div className="mt-16 max-w-xl">
        <h2 className="font-display text-3xl">Saved details</h2>
        <p className="mt-1 text-sm opacity-70">{user.email}</p>
        {searchParams.saved && <p role="status" className="mt-4 text-sm text-gold-text">Saved.</p>}
        {searchParams.error && <p role="alert" className="mt-4 text-sm text-red-800">Please check your details and try again.</p>}
        <form action={saveDetails} className="mt-6 space-y-4">
          {field("Name", "name", customer?.name, "name")}
          {field("Address", "line1", a.line1, "address-line1")}
          {field("Apartment, suite", "line2", a.line2, "address-line2")}
          <div className="grid gap-4 sm:grid-cols-3">
            {field("City", "city", a.city, "address-level2")}
            <div>
              <label htmlFor="state" className="label mb-1 block">State</label>
              <select id="state" name="state" defaultValue={a.state ?? ""} autoComplete="address-level1" className="field">
                <option value="">Choose…</option>
                {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            {field("ZIP code", "postalCode", a.postalCode, "postal-code")}
          </div>
          <button type="submit" className="btn-primary">Save details</button>
        </form>
      </div>
    </section>
  );
}
