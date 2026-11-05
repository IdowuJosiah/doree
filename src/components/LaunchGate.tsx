"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

// Pages that stay reachable while the teaser is on (linked from it).
const OPEN = ["/policies/"];

/**
 * Shows the teaser instead of the shop until launch. A signed-in admin sees
 * the real shop with a bar saying visitors still see the teaser. This only
 * changes what is displayed; the shop pages hold nothing private.
 */
export function LaunchGate({ teaser, children }: { teaser: React.ReactNode; children: React.ReactNode }) {
  const path = usePathname() ?? "/";
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let live = true;
    createBrowserSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (live) setAdmin(data.session?.user.app_metadata?.role === "admin");
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (OPEN.some((p) => path.startsWith(p))) return children;
  if (!admin) return teaser;
  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-ink px-4 py-2 text-center text-xs text-cream">
        <span>Admin preview: visitors still see the launch teaser.</span>
        <Link href="/admin/content" className="underline underline-offset-2 hover:text-gold">Teaser settings</Link>
        <Link href="/admin" className="underline underline-offset-2 hover:text-gold">Back to admin</Link>
      </div>
      {children}
    </>
  );
}
