"use server";

import { adminDb } from "@/lib/auth";
import { fail, saved } from "../_lib";

export async function deleteMessage(id: string) {
  const db = await adminDb();
  const { error } = await db.from("contact_messages").delete().eq("id", id);
  if (error) fail("/admin/messages", error.message);
  saved("/admin/messages");
}
