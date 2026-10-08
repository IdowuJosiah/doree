import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { createSquarePayment } from "@/lib/square";

const schema = z.object({ orderId: z.string().uuid(), sourceId: z.string().min(1).max(500) });

// Charges the pending order for exactly the total stored in the database.
// The order is marked Paid by the Square webhook, not here.
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const db = createServiceClient();
  const { data: order } = await db
    .from("orders")
    .select("id, number, email, total, status, order_items(variant_id, quantity)")
    .eq("id", parsed.data.orderId)
    .maybeSingle();
  if (!order || order.status !== "pending") {
    return NextResponse.json({ error: "This order can no longer be paid." }, { status: 409 });
  }

  // Stock may have changed since the order was created.
  const wanted = order.order_items.filter((i: { variant_id: string | null }) => i.variant_id);
  const { data: stock } = await db
    .from("product_variants")
    .select("id, stock")
    .in("id", wanted.map((i: { variant_id: string }) => i.variant_id));
  const available = new Map((stock ?? []).map((s) => [s.id, s.stock]));
  if (wanted.some((i: { variant_id: string; quantity: number }) => (available.get(i.variant_id) ?? 0) < i.quantity)) {
    return NextResponse.json({ error: "An item in your order just sold out." }, { status: 409 });
  }

  try {
    const payment = await createSquarePayment({
      sourceId: parsed.data.sourceId,
      orderId: order.id,
      orderNumber: order.number,
      amountCents: order.total,
      buyerEmail: order.email,
    });
    return NextResponse.json({ status: payment.status });
  } catch (e) {
    // The order stays pending with no stock change; the customer can retry.
    return NextResponse.json({ error: e instanceof Error ? e.message : "Payment failed" }, { status: 402 });
  }
}
