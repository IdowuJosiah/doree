import type { Metadata } from "next";
import Link from "next/link";
import { Shaped, type Shape } from "@/components/Shaped";

export const metadata: Metadata = { title: "Care and guides" };

const guides: { slug: string; title: string; text: string; shape: Shape }[] = [
  { slug: "size-guide", title: "Size guide", text: "Ring, bracelet and necklace sizes.", shape: "arch" },
  { slug: "jewelry-care", title: "Jewelry care", text: "Keep every piece bright for years.", shape: "quarter" },
  { slug: "materials", title: "Materials", text: "What our jewelry is made of.", shape: "arch" },
];

export default function GuidesPage() {
  return (
    <section className="section container-page">
      <h1 className="display-xl">Care and guides</h1>
      <p className="mt-6 max-w-xl text-lg">Everything you need to choose, wear and look after your jewelry.</p>
      <ul className="mt-12 grid gap-10 sm:grid-cols-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={`/guides/${g.slug}`} className="zoom group block">
              <Shaped image={{ alt: "" }} shape={g.shape} />
              <h2 className="mt-4 font-display text-2xl group-hover:text-olive">{g.title}</h2>
              <p className="text-sm">{g.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
