"use client";

import { usePathname } from "next/navigation";

// Pages that stay reachable while the teaser is on (linked from it).
const OPEN = ["/policies/"];

/** Shows the teaser instead of the shop until launch. */
export function LaunchGate({ teaser, children }: { teaser: React.ReactNode; children: React.ReactNode }) {
  const path = usePathname() ?? "/";
  return OPEN.some((p) => path.startsWith(p)) ? children : teaser;
}
