"use server";

import { headers } from "next/headers";
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
  if (error) redirect(`/login?error=signin&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (password.length < 8) redirect("/login?tab=signup&error=short");

  const origin = headers().get("origin") ?? "";
  const { data, error } = await createSessionClient().auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: `${origin}/auth/callback?next=/account` },
  });
  if (error) redirect(`/login?tab=signup&error=signup`);
  // With email confirmation on (the Supabase default) there is no session yet.
  if (!data.session) redirect("/login?tab=signup&sent=1");
  redirect("/account");
}

export async function signOut() {
  await createSessionClient().auth.signOut();
  redirect("/");
}
