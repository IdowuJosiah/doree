import type { Metadata } from "next";
import Link from "next/link";
import { WishlistGrid } from "@/components/store/WishlistGrid";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <section className="section container-page">
      <Link href="/account" className="text-link text-sm">← Account</Link>
      <h1 className="display-xl mt-2">Wishlist</h1>
      <WishlistGrid />
    </section>
  );
}
