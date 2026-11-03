import Link from "next/link";
import type { TeaserContent } from "@/lib/data/site";
import { Logo } from "./Logo";
import { Shaped } from "./Shaped";
import { SignupForm } from "./SignupForm";

// The whole shop until launch: the coming collection and an email sign-up.
export function Teaser({ teaser, image, instagramUrl }: { teaser: TeaserContent; image: string; instagramUrl: string }) {
  const year = new Date().getFullYear();
  return (
    <div className="flex min-h-screen flex-col bg-cream-deep">
      <header className="container-page flex justify-center py-6">
        <Logo color="ink" height={32} priority />
      </header>

      <main className="container-page grid flex-1 items-center gap-12 py-8 lg:grid-cols-2 lg:gap-24 lg:py-10">
        <div className="text-center lg:text-left">
          <h1 className="display-xl">{teaser.title}</h1>
          <p className="script-line mt-3">{teaser.script}</p>
          <p className="mx-auto mb-8 mt-6 max-w-md lg:mx-0">{teaser.text}</p>
          <div className="flex justify-center lg:justify-start">
            <SignupForm source="coming_soon" buttonLabel="Notify me" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[15rem] lg:max-w-sm">
          <Shaped image={{ src: image || undefined, alt: `The ${teaser.title} collection` }} shape="arch" priority sizes="(min-width: 1024px) 24rem, 80vw" className="!bg-line [&_.placeholder]:!bg-line" />
        </div>
      </main>

      <footer className="container-page flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-line py-6 text-sm">
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gold-text">Instagram</a>
        <Link href="/policies/returns" className="hover:text-gold-text">Returns</Link>
        <Link href="/policies/privacy" className="hover:text-gold-text">Privacy</Link>
        <span className="opacity-70">© {year} Dorée</span>
      </footer>
    </div>
  );
}
