"use client";

import { useEffect, useState } from "react";

// The order becomes Paid when Square's webhook arrives, usually within a few
// seconds of the redirect, so this checks a few times.
export function PaymentStatus({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status !== "pending") return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries++;
      const res = await fetch(`/api/checkout/status?orderId=${orderId}`).catch(() => null);
      const json = res?.ok ? await res.json() : null;
      if (json?.status && json.status !== "pending") setStatus(json.status);
      if (tries >= 10) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [orderId, status]);

  const text =
    status === "pending" ? "We are confirming your payment…" : status === "cancelled" ? "This order was cancelled." : "Your payment is confirmed.";
  return <p role="status" className="mt-4 text-olive">{text}</p>;
}
