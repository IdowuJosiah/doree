import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/config";
import { sendOrderEmails } from "@/lib/email/order-emails";
import { createServiceClient } from "@/lib/supabase/service";
import { handlePaymentEvent, verifySquareSignature, type SquarePaymentEvent } from "@/lib/square-webhook";

export async function POST(request: Request) {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const url = process.env.SQUARE_WEBHOOK_URL;
  if (!key || !url) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });

  const rawBody = await request.text();
  if (!verifySquareSignature(rawBody, request.headers.get("x-square-hmacsha256-signature"), key, url)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const db = createServiceClient();
  const event = JSON.parse(rawBody) as SquarePaymentEvent;
  try {
    const result = await handlePaymentEvent(event, {
      currency: siteConfig.currency,
      async findOrder(orderId) {
        const { data, error } = await db.from("orders").select("id, status, total").eq("id", orderId).maybeSingle();
        if (error) throw error;
        return data;
      },
      async markPaid(orderId, paymentId) {
        const { data, error } = await db.rpc("mark_order_paid", { p_order_id: orderId, p_payment_id: paymentId });
        if (error) throw error;
        return data === true;
      },
    });
    // Stock changed, so cached shop pages may need to show "Sold out".
    if (result === "paid") {
      revalidatePath("/", "layout");
      // Only the delivery that marks the order paid sends emails, so Square's
      // retries never send duplicates. Email problems are logged, not retried.
      await sendOrderEmails(event.data!.object!.payment!.reference_id!);
    }
    if (result === "amount_mismatch" || result === "unknown_order") console.error("square webhook", result);
    return NextResponse.json({ result });
  } catch (e) {
    // A 5xx makes Square retry the delivery.
    console.error("square webhook failed", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
