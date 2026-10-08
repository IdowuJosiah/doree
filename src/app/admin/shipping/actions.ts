"use server";

import { adminDb } from "@/lib/auth";
import { dollarsToCents } from "@/lib/format";
import { isUsState } from "@/lib/us-states";
import { fail, refreshPublic, saved, str } from "../_lib";

export async function saveShipping(fd: FormData) {
  const db = await adminDb();
  let fixed: number;
  let other: number;
  try {
    fixed = dollarsToCents(str(fd, "fixed_fee") || "0");
    other = dollarsToCents(str(fd, "other_fee") || "0");
  } catch (e) {
    fail("/admin/shipping", (e as Error).message);
  }
  const states = fd.getAll("states").map(String).filter(isUsState);
  const { error } = await db.from("shipping_settings").upsert({ id: 1, fixed_fee_states: states, fixed_fee: fixed, other_fee: other });
  if (error) fail("/admin/shipping", error.message);
  refreshPublic();
  saved("/admin/shipping");
}
