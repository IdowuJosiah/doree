"use server";

import { redirect } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { parseStockChanges } from "@/lib/inventory";
import { fail, refreshPublic } from "../_lib";

/**
 * Saves every stock count that was changed on the inventory screen.
 * Each update only applies if the stock is still what the screen showed, so a
 * sale that came in while Dorée was editing is never silently overwritten.
 */
export async function saveStock(returnTo: string, fd: FormData) {
  const db = await adminDb();
  const back = returnTo.startsWith("/admin/inventory") ? returnTo : "/admin/inventory";
  const sep = back.includes("?") ? "&" : "?";

  const changes = parseStockChanges(fd.entries());
  if (typeof changes === "string") fail("/admin/inventory", changes);

  let conflicts = 0;
  for (const c of changes) {
    const { data, error } = await db.from("product_variants").update({ stock: c.to }).eq("id", c.id).eq("stock", c.from).select("id");
    if (error) fail("/admin/inventory", error.message);
    if (!data?.length) conflicts++;
  }

  if (changes.length) refreshPublic();
  if (conflicts) {
    redirect(`${back}${sep}error=${encodeURIComponent(`${conflicts} item(s) sold while you were editing, so they were not changed. Check the new numbers and save again.`)}`);
  }
  redirect(`${back}${sep}saved=1`);
}
