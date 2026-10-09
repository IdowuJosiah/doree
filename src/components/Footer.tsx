import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { Logo } from "./Logo";

const shop = [
  { href: "/shop/earrings", label: "Earrings" },
  { href: "/shop/necklaces", label: "Necklaces" },
  { href: "/shop/bracelets", label: "Bracelets" },
  { href: "/shop/rings", label: "Rings" },
];
const help = [
  { href: "/guides", label: "Care and guides" },
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/returns", label: "Returns" },
  { href: "/contact", label: "Contact" },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="label mb-4 font-sans text-gold-text">{title}</h2>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-gold-text">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ instagramUrl }: { instagramUrl: string }) {
  return (
    <footer className="border-t border-line">
      <div className="container-page grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo color="ink" height={32} />
          <p className="script-line mt-4">{siteConfig.tagline}</p>
        </div>
        <Column title="Shop" links={shop} />
        <Column title="Help" links={help} />
        <div>
          <h2 className="label mb-4 font-sans text-gold-text">Follow</h2>
          <a href={instagramUrl} className="hover:text-gold-text" target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </div>
      </div>
      <div className="container-page flex flex-wrap justify-between gap-2 border-t border-line py-6 text-sm">
        <p>&copy; {new Date().getFullYear()} {siteConfig.name}</p>
        <p className="flex gap-4">
          <Link href="/policies/privacy" className="hover:text-gold-text">Privacy</Link>
          <Link href="/policies/terms" className="hover:text-gold-text">Terms</Link>
        </p>
      </div>
    </footer>
  );
}
