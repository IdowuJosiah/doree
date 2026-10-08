import Link from "next/link";
import { Cover } from "@/components/Cover";
import { Reveal } from "@/components/Reveal";
import { Shaped, type Shape } from "@/components/Shaped";
import { Logo } from "@/components/Logo";
import { listCollections } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/site";

export const revalidate = 3600;

const tileShapes: Shape[] = ["rect", "arch", "arch", "quarter", "rect"];

export default async function Home() {
  const [content, collections] = await Promise.all([getSiteContent(), listCollections()]);
  const { home_hero: hero, brand_statement: statement, feature_panel: feature, instagram } = content;
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
                <Shaped image={{ src: c.bannerUrl ?? undefined, alt: c.name }} shape={tileShapes[i]} />
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

      {/* 4. Feature split */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[24rem]">
          <Cover src={feature.image} alt={feature.title} sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
        <div className="flex flex-col items-start justify-center gap-4 bg-olive p-8 text-cream lg:p-24">
          <Logo color="cream" height={26} />
          <p className="font-script text-3xl">{feature.script}</p>
          <h2 className="font-display text-4xl uppercase lg:text-5xl">{feature.title}</h2>
          <p className="max-w-sm">{feature.text}</p>
          <Link href={feature.buttonHref} className="btn-outline-cream mt-2">
            {feature.buttonLabel}
          </Link>
        </div>
      </section>

      {/* 5. Instagram */}
      <section className="section container-page">
        <Reveal>
          <h2 className="mb-8 text-center font-display text-3xl">
            <a href={instagram.url} target="_blank" rel="noopener noreferrer" className="hover:text-olive">
              {instagram.handle}
            </a>
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <a
              key={i}
              href={instagram.url}
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
