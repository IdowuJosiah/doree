import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/Cover";
import { Reveal } from "@/components/Reveal";
import { Shaped } from "@/components/Shaped";
import { TextBody } from "@/components/TextBody";
import { getPage } from "@/lib/data/pages";
import { getSiteContent } from "@/lib/data/site";

export const metadata: Metadata = { title: "About" };
export const revalidate = 60;

export default async function AboutPage() {
  const [page, { page_photos: photos }] = await Promise.all([getPage("about").then((p) => p!), getSiteContent()]);
  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center">
        <Cover src={photos["about:header"]?.url} framing={photos["about:header"]?.position} alt="Dorée" priority />
        {/* A light veil keeps the title readable over a photo. */}
        {photos["about:header"]?.url && <div className="absolute inset-0 bg-[rgba(253,250,244,0.55)]" aria-hidden="true" />}
        <div className="relative px-4 text-center">
          <h1 className="display-xl">{page.title}</h1>
          <p className="script-line mt-3">{page.intro}</p>
        </div>
      </section>
      <section className="section container-page">
        <Reveal className="mx-auto max-w-xl text-lg">
          <TextBody body={page.body} />
        </Reveal>
      </section>
      <section className="container-page grid grid-cols-3 gap-3 lg:gap-6">
        {(["Studio", "Making", "Wearing"] as const).map((alt, i) => {
          const photo = photos[`about:${i + 1}`];
          return <Shaped key={alt} image={{ src: photo?.url, alt, objectPosition: photo?.position }} shape="arch" />;
        })}
      </section>
      <section className="section container-page text-center">
        <Link href="/shop" className="btn-outline">Shop the collection</Link>
      </section>
    </>
  );
}
