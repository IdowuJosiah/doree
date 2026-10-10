"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyAddress, sendEmail } from "@/lib/email/send";
import { contactAlert } from "@/lib/email/templates";

export type ContactState = { status: "idle" | "ok" | "error"; message: string };

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(5000),
  company: z.string().max(0).optional().catch("bot"),
});

export async function sendMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Please fill in your name, a valid email and a message." };
  if (parsed.data.company) return { status: "ok", message: "Thank you. We will reply soon." };
  if (!isSupabaseConfigured()) return { status: "error", message: "The contact form is not open yet. Please email us instead." };
  try {
    const { name, email, message } = parsed.data;
    const { error } = await createServiceClient().from("contact_messages").insert({ name, email, message });
    if (error) throw error;
    // Let Dorée know straight away; replying to the alert answers the customer.
    if (notifyAddress()) await sendEmail({ to: notifyAddress(), email: contactAlert({ name, email, message }), replyTo: email });
  } catch (e) {
    console.error("contact failed", e);
    return { status: "error", message: "Something went wrong. Please email us instead." };
  }
  return { status: "ok", message: "Thank you. We will reply soon." };
}
