"use server";

import { redirect } from "next/navigation";
import { adminDb } from "@/lib/auth";
import { fail } from "../_lib";
import { scanStorage } from "./scan";

export async function deleteUnusedFiles() {
  const db = await adminDb();
  let removed = 0;
  try {
    // Scan again rather than trusting the page, in case anything changed.
    const { unused } = await scanStorage(db);
    for (let i = 0; i < unused.length; i += 100) {
      const batch = unused.slice(i, i + 100).map((f) => f.path);
      const { error } = await db.storage.from("media").remove(batch);
      if (error) throw new Error(error.message);
      removed += batch.length;
    }
  } catch (e) {
    fail("/admin/storage", `Stopped after ${removed} files: ${e instanceof Error ? e.message : "unknown error"}`);
  }
  redirect(`/admin/storage?removed=${removed}`);
}
