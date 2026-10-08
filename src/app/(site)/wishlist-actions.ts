"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { listProductsByIds } from "@/lib/data/catalog";
import { createSessionClient } from "@/lib/supabase/server";

const ids = z.array(z.string().uuid()).max(200);

/** Server wishlist for the signed-in customer, or null for guests. */
export async function syncWishlist(localIds: string[]): Promise<string[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = createSessionClient();
  const parsed = ids.safeParse(localIds);
  if (parsed.success && parsed.data.length) {
    await db
      .from("wishlist_items")
      .upsert(parsed.data.map((product_id) => ({ customer_id: user.id, product_id })), { ignoreDuplicates: true });
  }
  const { data } = await db.from("wishlist_items").select("product_id").eq("customer_id", user.id);
  return (data ?? []).map((r) => r.product_id as string);
}

export async function setWishlisted(productId: string, on: boolean) {
  const user = await getCurrentUser();
  if (!user || !z.string().uuid().safeParse(productId).success) return;
  const db = createSessionClient();
  if (on) await db.from("wishlist_items").upsert({ customer_id: user.id, product_id: productId }, { ignoreDuplicates: true });
  else await db.from("wishlist_items").delete().eq("customer_id", user.id).eq("product_id", productId);
}

export async function wishlistProducts(productIds: string[]) {
  const parsed = ids.safeParse(productIds);
  return parsed.success ? listProductsByIds(parsed.data) : [];
}
