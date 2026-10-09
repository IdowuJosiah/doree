"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendMessage, type ContactState } from "@/app/(site)/contact/actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary">{pending ? "Sending…" : "Send message"}</button>;
}

export function ContactForm() {
  const [state, action] = useFormState<ContactState, FormData>(sendMessage, { status: "idle", message: "" });
  if (state.status === "ok") return <p role="status" className="font-display text-2xl text-gold-text">{state.message}</p>;
  return (
    <form action={action} className="space-y-5">
      <div aria-hidden="true" className="hidden"><input name="company" tabIndex={-1} autoComplete="off" /></div>
      <div>
        <label htmlFor="c-name" className="label mb-1 block">Name</label>
        <input id="c-name" name="name" required autoComplete="name" className="field" />
      </div>
      <div>
        <label htmlFor="c-email" className="label mb-1 block">Email</label>
        <input id="c-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="c-message" className="label mb-1 block">Message</label>
        <textarea id="c-message" name="message" required rows={6} maxLength={5000} className="field !h-auto py-3" />
      </div>
      {state.status === "error" && <p role="alert" className="text-sm text-red-800">{state.message}</p>}
      <Submit />
    </form>
  );
}
