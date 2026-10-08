"use server";

import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

const safeNext = (next: string) => (next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin");

// Only accounts with the admin role get in. A customer's correct password is
// refused with the same message as a wrong one, and their session is ended.
export async function adminSignIn(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  if (!isSupabaseConfigured()) redirect("/admin/login?error=1");
  const db = createSessionClient();
  const { data, error } = await db.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error || !isAdminUser(data.user)) {
    if (!error) await db.auth.signOut();
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export async function adminSignOut() {
  await createSessionClient().auth.signOut();
  redirect("/admin/login");
}
