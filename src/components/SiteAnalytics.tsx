"use client";

import { Analytics } from "@vercel/analytics/next";

// Vercel Web Analytics (cookie-free page views). Admin pages are left out so
// the numbers only show shoppers.
export function SiteAnalytics() {
  return <Analytics beforeSend={(event) => (new URL(event.url).pathname.startsWith("/admin") ? null : event)} />;
}
