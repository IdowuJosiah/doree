import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { adminSignIn } from "./actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  if (isAdminUser(await getCurrentUser())) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-deep px-4">
      <div className="w-full max-w-sm border border-line bg-cream p-8">
        <Logo color="ink" height={32} className="mx-auto" priority />
        <h1 className="label mt-6 text-center">Store admin</h1>
        <form action={adminSignIn} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={searchParams.next ?? ""} />
          <div>
            <label htmlFor="email" className="label mb-2 block">Email</label>
            <input id="email" name="email" type="email" required autoComplete="username" className="field" />
          </div>
          <div>
            <label htmlFor="password" className="label mb-2 block">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
          </div>
          {searchParams.error && (
            <p role="alert" className="text-sm text-red-800">Those details are not valid for the store admin.</p>
          )}
          <button type="submit" className="btn-primary w-full">Sign in</button>
        </form>
      </div>
    </main>
  );
}
