"use server";

import { adminDb } from "@/lib/auth";
import { fail, saved, str } from "../_lib";

// Orders become Paid only through the Square webhook, which also reduces
// stock. Dorée can mark a paid order Fulfilled (or back to Paid), and can
// cancel any order. She cannot mark a pending order paid by hand.
const allowed: Record<string, string[]> = {
  pending: ["cancelled"],
  paid: ["fulfilled", "cancelled"],
  fulfilled: ["paid", "cancelled"],
  cancelled: [],
};

export async function setOrderStatus(id: string, fd: FormData) {
  const db = await adminDb();
  const path = `/admin/orders/${id}`;
  const next = str(fd, "status");
  const { data: order } = await db.from("orders").select("status").eq("id", id).maybeSingle();
  if (!order) fail("/admin/orders", "Order not found.");
  if (!(allowed[order.status] ?? []).includes(next)) fail(path, `An order that is ${order.status} cannot be changed to ${next}.`);
  const { error } = await db.from("orders").update({ status: next }).eq("id", id);
  if (error) fail(path, error.message);
  saved(path);
}

export async function saveOrderNote(id: string, fd: FormData) {
  const db = await adminDb();
  const { error } = await db.from("orders").update({ note: str(fd, "note") }).eq("id", id);
  if (error) fail(`/admin/orders/${id}`, error.message);
  saved(`/admin/orders/${id}`);
}
