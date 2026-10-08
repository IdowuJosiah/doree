import { NextResponse } from "next/server";
import { checkoutSchema, createPendingOrder, CheckoutError } from "@/lib/checkout";
import { getCurrentUser } from "@/lib/auth";

// Creates the order as pending and returns server-calculated amounts.
export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    const order = await createPendingOrder(parsed.data, user?.id ?? null);
    return NextResponse.json({
      orderId: order.orderId,
      number: order.number,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
    });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ error: e.message }, { status: 409 });
    console.error("checkout failed", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
