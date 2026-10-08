import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Client bound to the signed-in user's session. Queries run as that user, so
// row-level security applies (this is what admin writes use).
export function createSessionClient() {
  const store = cookies();
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component; middleware refreshes the session.
        }
      },
    },
  });
}
