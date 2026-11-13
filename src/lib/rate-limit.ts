import "server-only";
import { createServiceClient } from "./supabase/service";

// Limits for the public checkout and forms. Each is "at most N in M seconds"
// for one visitor (by IP address). Generous for real shoppers, tight enough
// to stop card testing and form flooding.
export const LIMITS = {
  // Creating an order (also covers guessing discount codes).
  checkout: { max: 15, windowSeconds: 10 * 60 },
  // Card payment attempts, per visitor and per order.
  pay: { max: 8, windowSeconds: 10 * 60 },
  payPerOrder: { max: 5, windowSeconds: 60 * 60 },
  contact: { max: 5, windowSeconds: 60 * 60 },
  subscribe: { max: 10, windowSeconds: 60 * 60 },
} as const;

export const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

/** The visitor's IP address, as reported by Vercel's edge. */
export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Records an attempt and says whether it is allowed. If the rate-limit table
 * is not set up yet (migration 0008) or the database is unreachable, it
 * allows the attempt rather than blocking real customers.
 */
export async function allow(name: keyof typeof LIMITS, who: string): Promise<boolean> {
  const { max, windowSeconds } = LIMITS[name];
  try {
    const { data, error } = await createServiceClient().rpc("hit_rate_limit", {
      p_key: `${name}:${who}`,
      p_window_seconds: windowSeconds,
      p_max: max,
    });
    if (error) {
      console.warn("rate limit unavailable", error.message);
      return true;
    }
    return data !== false;
  } catch (e) {
    console.warn("rate limit unavailable", e);
    return true;
  }
}
