"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

// Only same-site paths are accepted so the redirect cannot leave the site.
const safeNext = (next: string) => (next.startsWith("/") && !next.startsWith("//") ? next : "/account");

export async function signIn(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const { error } = await createSessionClient().auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signOut() {
  await createSessionClient().auth.signOut();
  redirect("/");
}
