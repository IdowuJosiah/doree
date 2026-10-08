import type { Metadata } from "next";
import Link from "next/link";
import { PaymentStatus } from "@/components/checkout/PaymentStatus";
import { Logo } from "@/components/Logo";
import { formatPrice } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };
export const dynamic = "force-dynamic";

type Item = { name: string; price: number; quantity: number };

export default async function OrderConfirmation({ searchParams }: { searchParams: { order?: string } }) {
  const id = searchParams.order ?? "";
  const valid = /^[0-9a-f-]{36}$/i.test(id) && isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { data: order } = valid
    ? await createServiceClient().from("orders").select("number, email, status, subtotal, shipping_fee, total, order_items(name, price, quantity)").eq("id", id).maybeSingle()
    : { data: null };

  return (
    <section className="section container-page max-w-2xl text-center">
      <Logo color="olive" height={40} className="mx-auto" />
      <p className="script-line mt-8">Thank you</p>
      {order ? (
        <>
          <h1 className="mt-2 font-display text-4xl uppercase lg:text-5xl">Order #{order.number}</h1>
          <PaymentStatus orderId={id} initialStatus={order.status} />
          <p className="mt-2">A confirmation will be sent to {order.email}.</p>
          <div className="mt-10 border border-line p-6 text-left text-sm">
            <ul className="divide-y divide-line">
              {(order.order_items as Item[]).map((i, n) => (
                <li key={n} className="flex justify-between gap-4 py-2"><span>{i.name} × {i.quantity}</span><span>{formatPrice(i.price * i.quantity)}</span></li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{formatPrice(order.shipping_fee)}</dd></div>
              <div className="flex justify-between text-base font-medium"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </div>
        </>
      ) : (
        <h1 className="mt-2 font-display text-4xl uppercase">We could not find that order</h1>
      )}
      <Link href="/shop" className="btn-outline mt-10">Continue shopping</Link>
    </section>
  );
}
