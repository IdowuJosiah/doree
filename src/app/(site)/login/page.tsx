import type { Metadata } from "next";
import Link from "next/link";
import { signIn, signUp } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

const errors: Record<string, string> = {
  signin: "That email and password did not match.",
  signup: "We could not create that account. It may already exist; try signing in.",
  short: "Choose a password of at least 8 characters.",
};

function Input({ label, name, type = "text", autoComplete }: { label: string; name: string; type?: string; autoComplete: string }) {
  return (
    <div>
      <label htmlFor={name} className="label mb-2 block">{label}</label>
      <input id={name} name={name} type={type} required autoComplete={autoComplete} minLength={type === "password" && autoComplete === "new-password" ? 8 : undefined} className="field" />
    </div>
  );
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string; tab?: string; sent?: string } }) {
  const signup = searchParams.tab === "signup";
  const next = searchParams.next ?? "";
  const tab = (active: boolean) => `label flex-1 border-b-2 py-3 text-center ${active ? "border-ink" : "border-line opacity-60 hover:opacity-100"}`;

  return (
    <section className="section container-page max-w-md">
      <h1 className="font-display text-4xl uppercase">{signup ? "Create account" : "Sign in"}</h1>
      <nav className="mt-8 flex" aria-label="Sign in or create an account">
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className={tab(!signup)} aria-current={!signup ? "page" : undefined}>Sign in</Link>
        <Link href={`/login?tab=signup${next ? `&next=${encodeURIComponent(next)}` : ""}`} className={tab(signup)} aria-current={signup ? "page" : undefined}>Create account</Link>
      </nav>

      {searchParams.sent ? (
        <p role="status" className="mt-8">Check your email for a link to confirm your account, then sign in. Any orders you placed as a guest with that email will appear in your account.</p>
      ) : (
        <form action={signup ? signUp : signIn} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />
          {signup && <Input label="Name" name="name" autoComplete="name" />}
          <Input label="Email" name="email" type="email" autoComplete="email" />
          <Input label="Password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} />
          {searchParams.error && errors[searchParams.error] && <p role="alert" className="text-sm text-red-800">{errors[searchParams.error]}</p>}
          <button type="submit" className="btn-primary w-full">{signup ? "Create account" : "Sign in"}</button>
        </form>
      )}
    </section>
  );
}
