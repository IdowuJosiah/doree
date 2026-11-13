"use server";

import { adminDb } from "@/lib/auth";
import { fail, saved, str } from "../_lib";

const PATH = "/admin/discounts";
const CODE = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;

/** "25" or "25.50" dollars to cents; blank is 0. */
function cents(v: string): number {
  if (!v) return 0;
  const n = Math.round(Number(v) * 100);
  if (!Number.isFinite(n) || n < 0) throw new Error("Minimum order must be a positive amount.");
  return n;
}

export async function createDiscount(fd: FormData) {
  const db = await adminDb();
  const code = str(fd, "code").toUpperCase().replace(/\s+/g, "");
  const percent = Number(str(fd, "percent"));
  const maxUses = str(fd, "max_uses");
  const ends = str(fd, "ends_at");
  if (!CODE.test(code)) fail(PATH, "Codes are 2 to 40 letters or numbers (dashes and underscores are fine, no spaces).");
  if (!Number.isInteger(percent) || percent < 1 || percent > 100) fail(PATH, "The discount must be a whole number from 1 to 100.");
  if (maxUses && (!Number.isInteger(Number(maxUses)) || Number(maxUses) < 1)) fail(PATH, "Usage limit must be a whole number, or left empty for unlimited.");
  let min = 0;
  try {
    min = cents(str(fd, "min_subtotal"));
  } catch (e) {
    fail(PATH, (e as Error).message);
  }
  const { error } = await db.from("discount_codes").insert({
    code,
    percent,
    max_uses: maxUses ? Number(maxUses) : null,
    min_subtotal: min,
    // The end date covers the whole of that day, US Eastern time.
    ends_at: ends ? new Date(`${ends}T23:59:59-05:00`).toISOString() : null,
  });
  if (error) fail(PATH, error.code === "23505" ? `${code} already exists.` : error.code === "42P01" ? "Run the discounts database update first (see below)." : error.message);
  saved(PATH);
}

export async function setDiscountActive(id: string, active: boolean) {
  const db = await adminDb();
  const { error } = await db.from("discount_codes").update({ active }).eq("id", id);
  if (error) fail(PATH, error.message);
  saved(PATH);
}

export async function deleteDiscount(id: string) {
  const db = await adminDb();
  const { error } = await db.from("discount_codes").delete().eq("id", id);
  if (error) fail(PATH, error.message);
  saved(PATH);
}
