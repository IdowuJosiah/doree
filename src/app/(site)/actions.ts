"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";

export type SignupState = { status: "idle" | "ok" | "error"; message: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  source: z.enum(["coming_soon", "newsletter"]).catch("newsletter"),
  // Hidden field people never see; bots that fill it in are ignored.
  company: z.string().max(0).optional().catch("bot"),
});

export async function subscribe(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Please enter a valid email address." };
  if (parsed.data.company) return { status: "ok", message: "Thank you. We will be in touch." };
  if (!isSupabaseConfigured()) return { status: "error", message: "Sign-ups are not open yet. Please try again soon." };

  try {
    const { error } = await createServiceClient()
      .from("subscribers")
      .upsert({ email: parsed.data.email, source: parsed.data.source }, { onConflict: "email", ignoreDuplicates: true });
    if (error) throw error;
  } catch (e) {
    console.error("subscribe failed", e);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
  return { status: "ok", message: "Thank you. You will be the first to know." };
}
