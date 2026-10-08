"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/server";
import { isUsState } from "@/lib/us-states";

const schema = z.object({
  name: z.string().trim().max(120),
  line1: z.string().trim().max(200),
  line2: z.string().trim().max(200),
  city: z.string().trim().max(100),
  state: z.string().trim().toUpperCase().refine((s) => s === "" || isUsState(s)),
  postalCode: z.string().trim().max(12),
});

export async function saveDetails(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/account?error=1");
  const { name, ...address } = parsed.data;
  // Row-level security limits this to the signed-in customer's own row.
  const { error } = await createSessionClient()
    .from("customers")
    .upsert({ id: user.id, email: user.email ?? "", name, address });
  redirect(error ? "/account?error=1" : "/account?saved=1");
}
