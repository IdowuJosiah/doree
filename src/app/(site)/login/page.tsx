import type { Metadata } from "next";
import { signIn } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  return (
    <section className="section container-page max-w-md">
      <h1 className="font-display text-4xl uppercase">Sign in</h1>
      <form action={signIn} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={searchParams.next ?? ""} />
        <div>
          <label htmlFor="email" className="label mb-2 block">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="password" className="label mb-2 block">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
        </div>
        {searchParams.error && (
          <p role="alert" className="text-sm text-red-800">
            That email and password did not match.
          </p>
        )}
        <button type="submit" className="btn-primary w-full">Sign in</button>
      </form>
    </section>
  );
}
