import "server-only";
import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./supabase/env";
import { createSessionClient } from "./supabase/server";

// getUser() validates the token with the auth server; it is never decoded
// from the cookie alone. The admin role lives in app_metadata, which users
// cannot edit (unlike user_metadata).
export const isAdminUser = (user: User | null) => user?.app_metadata?.role === "admin";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await createSessionClient().auth.getUser();
  return data.user;
}

// Every admin page and server action goes through this, so access is
// checked on the server for each request.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) redirect("/login?next=/admin");
  return user!;
}

// Session client for admin reads and writes: queries run as the admin user,
// so database row-level security enforces the role as well.
export async function adminDb() {
  await requireAdmin();
  return createSessionClient();
}
