import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// The confirmation page polls this until the webhook has marked the order Paid.
export async function GET(request: Request) {
  const orderId = new URL(request.url).searchParams.get("orderId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  const { data } = await createServiceClient().from("orders").select("status, number").eq("id", orderId).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ status: data.status, number: data.number });
}
