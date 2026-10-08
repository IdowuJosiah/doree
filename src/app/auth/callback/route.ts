import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

// Landing point for the email confirmation link: exchanges the one-time code
// for a session, then continues to the account.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/account";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/account";
  if (code) {
    const { error } = await createSessionClient().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=signin", url.origin));
}
