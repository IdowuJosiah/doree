"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { allow, clientIp, TOO_MANY } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/service";
import { uspsTrackingUrl } from "@/lib/tracking";

export type TrackedOrder = {
  number: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
  trackingNumber: string | null;
  trackingUrl: string | null;
  pickup: boolean;
};
export type TrackState = { status: "idle" | "found" | "error"; message: string; order?: TrackedOrder };

const schema = z.object({
  number: z.string().trim().transform((s) => s.replace(/^#/, "")).pipe(z.string().regex(/^\d{1,12}$/)),
  email: z.string().trim().toLowerCase().email().max(254),
});

const NOT_FOUND = "We could not find an order with that number and email. Check your order confirmation email and try again.";

export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Please enter your order number and the email you ordered with." };
  if (!isSupabaseConfigured()) return { status: "error", message: "Order tracking is not available yet." };
  if (!(await allow("track", clientIp(await headers())))) return { status: "error", message: TOO_MANY };
  try {
    const { data, error } = await createServiceClient()
      .from("orders")
      .select("number, status, email, created_at, tracking_number, fulfillment, order_items(name, quantity)")
      .eq("number", Number(parsed.data.number))
      .neq("status", "pending")
      .maybeSingle();
    if (error) throw error;
    // Same answer whether the number or the email is wrong, so neither can be guessed.
    if (!data || data.email.trim().toLowerCase() !== parsed.data.email) return { status: "error", message: NOT_FOUND };
    const tracking = (data.tracking_number as string | null) ?? null;
    return {
      status: "found",
      message: "",
      order: {
        number: data.number,
        status: data.status,
        createdAt: data.created_at,
        items: (data.order_items ?? []) as { name: string; quantity: number }[],
        trackingNumber: tracking,
        trackingUrl: tracking ? uspsTrackingUrl(tracking) : null,
        pickup: data.fulfillment === "pickup",
      },
    };
  } catch (e) {
    console.error("track failed", e);
    return { status: "error", message: "Something went wrong. Please try again or contact us." };
  }
}
