"use client";

import { useFormState, useFormStatus } from "react-dom";
import { subscribe, type SignupState } from "@/app/(site)/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Sending…" : label}
    </button>
  );
}

export function SignupForm({ source, buttonLabel }: { source: "coming_soon" | "newsletter"; buttonLabel: string }) {
  const [state, action] = useFormState<SignupState, FormData>(subscribe, { status: "idle", message: "" });

  if (state.status === "ok") {
    return <p role="status" className="font-display text-xl text-gold-text">{state.message}</p>;
  }

  return (
    <form action={action} className="w-full max-w-md">
      <input type="hidden" name="source" value={source} />
      <div aria-hidden="true" className="hidden">
        <label htmlFor={`${source}-company`}>Company</label>
        <input id={`${source}-company`} name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`${source}-email`} className="sr-only">Email address</label>
        <input id={`${source}-email`} name="email" type="email" required placeholder="Email address" autoComplete="email" className="field sm:flex-1" />
        <Submit label={buttonLabel} />
      </div>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-sm text-red-800">{state.message}</p>
      )}
    </form>
  );
}
