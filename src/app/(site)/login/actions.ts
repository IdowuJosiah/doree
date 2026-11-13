"use server";

import { redirect } from "next/navigation";
import { safePath } from "@/lib/safe-path";
import { SITE_URL } from "@/lib/site-url";
import { createSessionClient } from "@/lib/supabase/server";

// Only paths on this site are accepted so the redirect cannot leave it.
const safeNext = (next: string) => safePath(next, "/account");

export async function signIn(formData: FormData) {
  const next = safeNext(String(formData.get("next") ?? ""));
  const { error } = await (await createSessionClient()).auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect(`/login?error=signin&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (password.length < 8) redirect("/login?tab=signup&error=short");

  // The confirmation link always points at the real site, never at whatever
  // Origin header a request happened to send.
  const { data, error } = await (await createSessionClient()).auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${SITE_URL}/auth/callback?next=/account` },
  });
  if (error) redirect(`/login?tab=signup&error=signup`);
  // With email confirmation on (the Supabase default) there is no session yet.
  if (!data.session) redirect("/login?tab=signup&sent=1");
  redirect("/account");
}

export async function signOut() {
  await (await createSessionClient()).auth.signOut();
  redirect("/");
}
