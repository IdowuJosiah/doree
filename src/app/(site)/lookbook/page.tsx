import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Shaped, type Shape } from "@/components/Shaped";
import { getSiteContent } from "@/lib/data/site";

export const metadata: Metadata = { title: "Lookbook" };
export const revalidate = 60;

const shapes: Shape[] = ["rect", "arch", "arch", "quarter", "rect", "quarter-mirror"];

export default async function LookbookPage() {
  const { lookbook } = await getSiteContent();
  return (
    <section className="section container-page">
      <div className="relative mb-12">
        <h1 className="display-xl">Lookbook</h1>
        <p className="script-line absolute right-0 top-0 hidden sm:block">Worn and loved</p>
      </div>
      {lookbook.photos.length === 0 ? (
        <p>New photos are coming soon.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          {lookbook.photos.map((p, i) => {
            const tile = <Shaped image={{ src: p.url, alt: p.alt }} shape={shapes[i % shapes.length]} />;
            return (
              <li key={`${p.url}-${i}`}>
                <Reveal>
                  {p.productSlug ? (
                    <Link href={`/product/${p.productSlug}`} className="zoom block" aria-label={`${p.alt}, view the piece`}>{tile}</Link>
                  ) : (
                    tile
                  )}
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
