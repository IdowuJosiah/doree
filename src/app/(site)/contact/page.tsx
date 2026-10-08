import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="section container-page grid gap-12 lg:grid-cols-2 lg:gap-24">
      <div>
        <h1 className="display-xl">Contact</h1>
        <p className="mt-6 max-w-md text-lg">Questions about an order, sizing or a gift? Send a message and we will reply by email.</p>
        <p className="mt-8"><span className="label block">Email</span><a href={`mailto:${siteConfig.contactEmail}`} className="text-link">{siteConfig.contactEmail}</a></p>
      </div>
      <ContactForm />
    </section>
  );
}
