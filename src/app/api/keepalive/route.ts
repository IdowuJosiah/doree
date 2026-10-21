import { NextResponse } from "next/server";
import { publicClient } from "@/lib/supabase/public";

// Supabase pauses free projects after a week without activity. A Vercel cron
// job (vercel.json) calls this once a day so the database always has some.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // When CRON_SECRET is set, Vercel sends it with its cron requests; anyone
  // else is turned away.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = publicClient();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  const { error } = await db.from("collections").select("id", { count: "exact", head: true });
  if (error) {
    console.error("keepalive failed", error.message);
    return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
