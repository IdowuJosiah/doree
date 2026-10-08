import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

// Anonymous client for public pages. Row-level security limits it to
// published products and public content. Returns null when the database
// is not configured so the site still builds and renders empty states.
export function publicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createClient(supabaseUrl!, supabaseAnonKey!, { auth: { persistSession: false } });
}
