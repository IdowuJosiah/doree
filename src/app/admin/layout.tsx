import type { Metadata } from "next";

// Never cached or prerendered: access is checked on every request.
export const dynamic = "force-dynamic";

// The admin area is not linked from the public site and must never be indexed.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
