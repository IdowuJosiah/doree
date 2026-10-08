import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { signOut } from "@/app/(site)/login/actions";

// Never cached or prerendered: access is checked on every request.
export const dynamic = "force-dynamic";

// The admin area is not linked from the public site and must never be indexed.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false, nocache: true },
};

const nav = [
  { href: "/admin/products", label: "Products" },
  { href: "/admin/collections", label: "Collections" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/shipping", label: "Shipping" },
  { href: "/admin/content", label: "Site content" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[14rem_1fr]">
      <aside className="border-b border-line p-4 lg:border-b-0 lg:border-r lg:p-6">
        <Link href="/admin" aria-label="Admin home"><Logo color="ink" height={26} /></Link>
        <nav aria-label="Admin" className="label mt-4 flex flex-wrap gap-x-5 gap-y-1 lg:mt-8 lg:flex-col lg:gap-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="flex min-h-[44px] items-center hover:text-olive">{n.label}</Link>
          ))}
        </nav>
        <form action={signOut} className="mt-4 lg:mt-10">
          <p className="mb-2 break-all text-xs opacity-70">{user.email}</p>
          <button type="submit" className="text-link text-sm">Sign out</button>
        </form>
      </aside>
      <div className="min-w-0 p-4 sm:p-8">{children}</div>
    </div>
  );
}
