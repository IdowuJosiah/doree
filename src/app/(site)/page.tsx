import Link from "next/link";
import { Cover } from "@/components/Cover";
import { Reveal } from "@/components/Reveal";
import { Shaped, type Shape } from "@/components/Shaped";
import { Logo } from "@/components/Logo";
import { ProductCard } from "@/components/ProductCard";
import { SignupForm } from "@/components/SignupForm";
import { listBestSellers, listCollections } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/site";

// Refreshes at most a minute after any database change, so no redeploy is needed.
export const revalidate = 60;

const tileShapes: Shape[] = ["rect", "arch", "arch", "quarter", "rect"];

export default async function Home() {
  const [content, collections, bestSellers] = await Promise.all([getSiteContent(), listCollections(), listBestSellers(4)]);
  const { home_hero: hero, brand_statement: statement, feature_panel: feature, coming_soon: comingSoon, catalog_covers: covers } = content;
  const tiles = collections.slice(0, tileShapes.length);

  return (
    <>
      {/* 1. Hero */}
      <section className="relative grid min-h-[70vh] lg:grid-cols-2">
        <div className="relative">
          <Cover src={hero.leftImage} alt="Hero photo" priority sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
        <div className="relative hidden lg:block">
          <Cover src={hero.rightImage} alt="Hero photo" priority sizes="50vw" className={hero.rightImage ? "" : "!bg-line"} />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p className="script-line">{hero.script}</p>
          <h1 className="display-xl mt-2">{hero.title}</h1>
          <Link href={hero.buttonHref} className="btn-outline mt-8">
            {hero.buttonLabel}
          </Link>
        </div>
      </section>

      {/* 2. Brand statement */}
      <section className="section container-page text-center">
        <Reveal>
          <p className="mx-auto max-w-3xl font-display text-3xl lg:text-4xl">{statement.text}</p>
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
          {tiles.map((c, i) => (
            <Reveal key={c.id}>
              <Link href={`/shop/${c.slug}`} className="zoom block">
                <Shaped image={{ src: covers[c.id]?.url, alt: c.name, objectPosition: covers[c.id]?.position }} shape={tileShapes[i]} />
                <span className="label mt-3 block">{c.name}</span>
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

      {/* 4. Best sellers */}
      {bestSellers.length > 0 && (
        <section className="section container-page">
          <Reveal>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="script-line">Loved the most</p>
                <h2 className="display-xl">Best sellers</h2>
              </div>
              <Link href="/shop" className="btn-outline">
                Shop all
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
            {bestSellers.map((p) => (
              <Reveal key={p.id}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* 5. Feature split */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[24rem]">
          <Cover src={feature.image} alt={feature.title} sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
        <div className="flex flex-col items-start justify-center gap-4 bg-gold p-8 text-ink lg:p-24">
          <Logo color="ink" height={26} />
          <p className="font-script text-3xl">{feature.script}</p>
          <h2 className="font-display text-4xl uppercase text-ink lg:text-5xl">{feature.title}</h2>
          <p className="max-w-sm">{feature.text}</p>
          <Link href={feature.buttonHref} className="btn-outline mt-2">
            {feature.buttonLabel}
          </Link>
        </div>
      </section>

      {/* 6. Coming soon, with email sign-up (a plain newsletter band when switched off) */}
      <section className="bg-cream-deep">
        {comingSoon.enabled ? (
          <div className="section container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-24">
            <Reveal className="mx-auto w-full max-w-sm">
              <Shaped image={{ src: comingSoon.image || undefined, alt: comingSoon.title }} shape="arch" sizes="(min-width: 1024px) 24rem, 80vw" className="!bg-line [&_.placeholder]:!bg-line" />
            </Reveal>
            <Reveal>
              <p className="script-line">{comingSoon.script}</p>
              <h2 className="mt-2 font-display text-4xl uppercase lg:text-6xl">{comingSoon.title}</h2>
              {comingSoon.launch && <p className="label mt-4 text-gold-text">{comingSoon.launch}</p>}
              <p className="mb-8 mt-4 max-w-md">{comingSoon.text}</p>
              <SignupForm source="coming_soon" buttonLabel="Notify me" />
            </Reveal>
          </div>
        ) : (
          <div className="section container-page flex flex-col items-center gap-6 text-center">
            <p className="font-display text-2xl">Be the first to hear about new collections.</p>
            <SignupForm source="newsletter" buttonLabel="Subscribe" />
          </div>
        )}
      </section>
    </>
  );
}
