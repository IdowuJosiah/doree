import type { Metadata } from "next";
import Link from "next/link";
import { TrackForm } from "@/components/TrackForm";

export const metadata: Metadata = { title: "Track my order", robots: { index: false } };

export default function TrackPage() {
  return (
    <section className="section container-page grid gap-12 lg:grid-cols-2 lg:gap-24">
      <div>
        <h1 className="display-xl">Track my order</h1>
        <p className="mt-6 max-w-md text-lg">Enter your order number (from your confirmation email) and the email you ordered with.</p>
        <p className="mt-6 max-w-md text-sm opacity-80">
          Have an account? Your orders and tracking links are also under <Link href="/account/orders" className="text-link">My orders</Link>.
        </p>
      </div>
      <TrackForm />
    </section>
  );
}
