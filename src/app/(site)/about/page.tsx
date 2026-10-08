import type { Metadata } from "next";
import Link from "next/link";
import { Cover } from "@/components/Cover";
import { Reveal } from "@/components/Reveal";
import { Shaped } from "@/components/Shaped";
import { TextBody } from "@/components/TextBody";
import { getPage } from "@/lib/data/pages";

export const metadata: Metadata = { title: "About" };
export const revalidate = 60;

export default async function AboutPage() {
  const page = (await getPage("about"))!;
  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center">
        <Cover alt="Dorée" priority />
        <div className="relative px-4 text-center">
          <p className="script-line">{page.intro}</p>
          <h1 className="display-xl mt-2">{page.title}</h1>
        </div>
      </section>
      <section className="section container-page">
        <Reveal className="mx-auto max-w-xl text-lg">
          <TextBody body={page.body} />
        </Reveal>
      </section>
      <section className="container-page grid grid-cols-3 gap-3 lg:gap-6">
        {["Studio", "Making", "Wearing"].map((alt) => <Shaped key={alt} image={{ alt }} shape="arch" />)}
      </section>
      <section className="section container-page text-center">
        <Link href="/shop" className="btn-outline">Shop the collection</Link>
      </section>
    </>
  );
}
