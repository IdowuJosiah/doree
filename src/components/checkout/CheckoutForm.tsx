"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { ShippingSettings } from "@/lib/data/site";
import { formatPrice } from "@/lib/format";
import { shippingFeeFor } from "@/lib/pricing";
import { US_STATES } from "@/lib/us-states";
import { useCart } from "../store/Cart";
import { SquareCard } from "./SquareCard";

type Order = { orderId: string; number: number; subtotal: number; shippingFee: number; total: number };
type SquareConfig = { appId: string; locationId: string; sandbox: boolean };

function Input({ label, name, type = "text", autoComplete, required = true }: { label: string; name: string; type?: string; autoComplete?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="label mb-1 block">{label}{!required && <span className="ml-1 normal-case tracking-normal opacity-60">(optional)</span>}</label>
      <input id={name} name={name} type={type} autoComplete={autoComplete} required={required} className="field" />
    </div>
  );
}

export function CheckoutForm({ shipping, square }: { shipping: ShippingSettings; square: SquareConfig }) {
  const { items, subtotal, ready, clear } = useCart();
  const router = useRouter();
  const [state, setState] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tokenize, setTokenize] = useState<(() => Promise<string>) | null>(null);
  const onCardReady = useCallback((fn: () => Promise<string>) => setTokenize(() => fn), []);

  if (!ready) return <div className="h-96 animate-pulse bg-cream-deep" aria-hidden="true" />;
  if (items.length === 0 && !order) {
    return (
      <div className="py-12 text-center">
        <p className="font-display text-2xl">Your bag is empty.</p>
        <Link href="/shop" className="btn-outline mt-6">Shop now</Link>
      </div>
    );
  }

  const estimateFee = state ? shippingFeeFor(state, shipping) : null;
  const shown = order ?? { subtotal, shippingFee: estimateFee ?? 0, total: subtotal + (estimateFee ?? 0) };
  const paymentsConfigured = Boolean(square.appId && square.locationId);

  // Step 1: the server checks stock, recalculates every price and the
  // shipping fee from the database, and creates the order as pending.
  async function createOrder(form: HTMLFormElement) {
    const f = new FormData(form);
    const body = {
      email: f.get("email"),
      name: f.get("name"),
      address: { line1: f.get("line1"), line2: f.get("line2") || undefined, city: f.get("city"), state: f.get("state"), postalCode: f.get("postalCode") },
      items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    };
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
    setOrder(json);
  }

  // Step 2: Square charges the total stored on the order.
  async function pay() {
    if (!order || !tokenize) return;
    const sourceId = await tokenize();
    const res = await fetch("/api/checkout/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.orderId, sourceId }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Payment failed. Please try again.");
    clear();
    router.push(`/order-confirmation?order=${order.orderId}`);
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
      {/* Order summary: above the form on mobile, beside it on desktop. */}
      <aside className="order-first lg:order-last" aria-label="Order summary">
        <div className="border border-line p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl">Order summary</h2>
          <ul className="mt-4 divide-y divide-line text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-4 py-3">
                <span>{i.name}{i.variantLabel !== "One size" && ` (${i.variantLabel})`} × {i.quantity}</span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(shown.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{order || estimateFee !== null ? formatPrice(shown.shippingFee) : "Choose your state"}</dd></div>
            <div className="flex justify-between pt-2 text-base font-medium"><dt>Total</dt><dd>{formatPrice(shown.total)}</dd></div>
          </dl>
        </div>
      </aside>

      <div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => createOrder(e.currentTarget));
          }}
        >
          <fieldset disabled={Boolean(order) || busy} className="space-y-8">
            <div className="space-y-4">
              <legend className="font-display text-2xl">Contact</legend>
              <Input label="Email" name="email" type="email" autoComplete="email" />
            </div>
            <div className="space-y-4">
              <h2 className="font-display text-2xl">Shipping address</h2>
              <Input label="Full name" name="name" autoComplete="name" />
              <Input label="Address" name="line1" autoComplete="address-line1" />
              <Input label="Apartment, suite" name="line2" autoComplete="address-line2" required={false} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="City" name="city" autoComplete="address-level2" />
                <div>
                  <label htmlFor="state" className="label mb-1 block">State</label>
                  <select id="state" name="state" required autoComplete="address-level1" value={state} onChange={(e) => setState(e.target.value)} className="field">
                    <option value="" disabled>Choose…</option>
                    {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </select>
                </div>
                <Input label="ZIP code" name="postalCode" autoComplete="postal-code" />
              </div>
            </div>
            {!order && <button type="submit" className="btn-primary w-full sm:w-auto">{busy ? "Checking…" : "Continue to payment"}</button>}
          </fieldset>
        </form>

        {order && (
          <div className="mt-10 space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">Payment</h2>
              <button type="button" className="text-link text-sm" onClick={() => { setOrder(null); setTokenize(null); }}>Edit details</button>
            </div>
            {paymentsConfigured ? (
              <>
                <SquareCard appId={square.appId} locationId={square.locationId} sandbox={square.sandbox} onReady={onCardReady} />
                <button type="button" disabled={!tokenize || busy} onClick={() => void run(pay)} className="btn-primary w-full">
                  {busy ? "Processing…" : `Pay ${formatPrice(order.total)}`}
                </button>
                <p className="text-xs opacity-70">Payments are processed securely by Square.</p>
              </>
            ) : (
              <p role="alert" className="text-sm text-red-800">Card payments are not set up yet.</p>
            )}
          </div>
        )}

        {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
      </div>
    </div>
  );
}
