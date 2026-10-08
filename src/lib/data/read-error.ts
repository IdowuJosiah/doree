import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * During `next build` a failed read (for example before the database
 * migration has been run) renders the page's empty state instead of failing
 * the deploy. At runtime the error is thrown, so Next keeps serving the last
 * good cached page rather than caching an empty one.
 */
export function onReadError<T>(error: { message?: string }, fallback: T, what: string): T {
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    console.warn(`Build: could not read ${what} (${error.message}). Rendering without it; run the database migration and redeploy.`);
    return fallback;
  }
  throw error;
}
