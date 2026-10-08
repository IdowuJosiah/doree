import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Shaped, type Shape } from "@/components/Shaped";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/lib/config";

const tiles: { shape: Shape; alt: string; label: string }[] = [
  { shape: "rect", alt: "Earrings", label: "Earrings" },
  { shape: "arch", alt: "Necklaces", label: "Necklaces" },
  { shape: "arch", alt: "Bracelets", label: "Bracelets" },
  { shape: "quarter", alt: "Rings", label: "Rings" },
  { shape: "rect", alt: "New in", label: "New in" },
];

export default function Home() {
  return (
    <>
      {/* 1. Hero */}
      <section className="relative grid min-h-[70vh] lg:grid-cols-2">
        <div className="bg-cream-deep" role="img" aria-label="Hero photo, left" />
        <div className="hidden bg-line lg:block" role="img" aria-label="Hero photo, right" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p className="script-line">{siteConfig.tagline}</p>
          <h1 className="display-xl mt-2">The Soleil Collection</h1>
          <Link href="/shop" className="btn-outline mt-8">
            Shop now
          </Link>
        </div>
      </section>

      {/* 2. Brand statement */}
      <section className="section container-page text-center">
        <Reveal>
          <p className="mx-auto max-w-3xl font-display text-3xl lg:text-4xl">
            Everyday jewelry, made slowly and worn for years. Each piece is designed to feel like yours.
          </p>
        </Reveal>
      </section>

      {/* 3. Catalog */}
      <section className="section container-page">
        <Reveal>
          <div className="relative mb-12">
            <h2 className="display-xl">Catalog</h2>
            <p className="script-line absolute right-0 top-0 hidden sm:block">Made for you</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
          {tiles.map((t) => (
            <Reveal key={t.label}>
              <Link href="/shop" className="zoom block">
                <Shaped image={{ alt: t.alt }} shape={t.shape} />
                <span className="label mt-3 block">{t.label}</span>
              </Link>
            </Reveal>
          ))}
          <Reveal className="flex items-center justify-center">
            <div className="text-center">
              <p className="mb-6 max-w-[16rem] font-display text-2xl">Find the piece you will keep.</p>
              <Link href="/shop" className="btn-outline">
                See all
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. Feature split */}
      <section className="grid lg:grid-cols-2">
        <div className="min-h-[24rem] bg-cream-deep" role="img" aria-label="Feature photo" />
        <div className="flex flex-col items-start justify-center gap-4 bg-olive p-8 text-cream lg:p-24">
          <Logo color="cream" height={26} />
          <p className="font-script text-3xl">Jewelry created with love</p>
          <h2 className="font-display text-4xl uppercase lg:text-5xl">Soleil</h2>
          <p className="max-w-sm">Warm gold, soft curves and pieces light enough to forget you are wearing them.</p>
          <Link href="/shop" className="btn-outline-cream mt-2">
            Explore
          </Link>
        </div>
      </section>

      {/* 5. Instagram */}
      <section className="section container-page">
        <Reveal>
          <h2 className="mb-8 text-center font-display text-3xl">
            <a href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer" className="hover:text-olive">
              {siteConfig.instagram.handle}
            </a>
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <a
              key={i}
              href={siteConfig.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram photo ${i + 1}`}
              className={`aspect-square bg-cream-deep ${i >= 4 ? "hidden sm:block" : ""}`}
            />
          ))}
        </div>
      </section>

      {/* 6. Newsletter */}
      <section className="bg-cream-deep">
        <div className="section container-page flex flex-col items-center gap-6 text-center">
          <p className="font-display text-2xl">Be the first to hear about new collections.</p>
          <form className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input id="newsletter-email" type="email" required placeholder="Email address" className="field flex-1" />
            <button type="submit" className="btn-primary">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
