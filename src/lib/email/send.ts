import type { Email } from "./templates";

/**
 * Sends through Resend's HTTP API. The key lives only in the RESEND_API_KEY
 * environment variable. Returns false (and logs) instead of throwing, so a
 * mail problem never breaks checkout or the payment webhook.
 */
export async function sendEmail(args: {
  to: string;
  email: Email;
  replyTo?: string;
  /** Resend drops a second send with the same key, so retries never double-send. */
  idempotencyKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from || !args.to) {
    console.warn("email not sent: RESEND_API_KEY, EMAIL_FROM or recipient missing");
    return false;
  }
  try {
    const res = await (args.fetchImpl ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(args.idempotencyKey ? { "Idempotency-Key": args.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.email.subject,
        html: args.email.html,
        text: args.email.text,
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("email send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("email send failed", e);
    return false;
  }
}

/** Where alerts for Dorée go. */
export const notifyAddress = () => process.env.ORDER_NOTIFY_EMAIL ?? "";

/** Public address of the site, for links in emails. */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
