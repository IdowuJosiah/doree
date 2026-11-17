"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { trackOrder, type TrackState } from "@/app/(site)/track/actions";

const labels: Record<string, string> = {
  paid: "Paid, being prepared",
  fulfilled: "Sent",
  cancelled: "Cancelled",
};

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary">{pending ? "Looking…" : "Track order"}</button>;
}

export function TrackForm() {
  const [state, action] = useActionState<TrackState, FormData>(trackOrder, { status: "idle", message: "" });
  const o = state.order;
  return (
    <div className="space-y-10">
      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="t-number" className="label mb-1 block">Order number</label>
          <input id="t-number" name="number" required inputMode="numeric" placeholder="1001" className="field" />
        </div>
        <div>
          <label htmlFor="t-email" className="label mb-1 block">Email used for the order</label>
          <input id="t-email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        {state.status === "error" && <p role="alert" className="text-sm text-red-800">{state.message}</p>}
        <Submit />
      </form>

      {o && (
        <div role="status" className="border-t border-line pt-8">
          <p className="font-display text-2xl">Order #{o.number}</p>
          <p className="text-sm opacity-70">Placed {new Date(o.createdAt).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "America/Chicago" })}</p>
          <p className="label mt-4 text-gold-text">
            {o.pickup && o.status === "fulfilled" ? "Ready for pickup" : o.pickup && o.status === "paid" ? "Paid, being prepared for pickup" : labels[o.status] ?? o.status}
          </p>
          <p className="mt-3 text-sm">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</p>
          {o.pickup ? (
            o.status !== "cancelled" && (
              <p className="mt-6 text-sm">
                {o.status === "fulfilled"
                  ? "We emailed you the pickup location and time. Reply to that email if you need a different time."
                  : "We'll email you the pickup location and time once your order is processed and ready for pickup."}
              </p>
            )
          ) : o.trackingNumber && o.trackingUrl ? (
            <div className="mt-6">
              <p className="label">USPS tracking number</p>
              <p className="mt-1 tracking-wide">{o.trackingNumber}</p>
              <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-4">Track on USPS ↗</a>
            </div>
          ) : (
            o.status === "paid" && <p className="mt-6 text-sm">Your order is being prepared. You will get an email with the tracking number once it is sent.</p>
          )}
        </div>
      )}
    </div>
  );
}
