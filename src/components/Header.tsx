"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navLinks, siteConfig } from "@/lib/config";
import { Logo } from "./Logo";

const icon = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {siteConfig.announcement && (
        <p className="bg-olive px-4 py-2 text-center text-sm text-cream">{siteConfig.announcement}</p>
      )}
      <header
        className={`sticky top-0 z-40 border-b border-line bg-cream transition-[height] duration-300 ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        <div className="container-page relative flex h-full items-center justify-between">
          <button
            type="button"
            className="-ml-3 flex h-11 w-11 items-center justify-center lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <svg {...icon} aria-hidden="true">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </button>

          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="label hover:text-olive">
                {l.label}
              </Link>
            ))}
          </nav>

          <Link href="/" aria-label="Dorée home" className="absolute left-1/2 -translate-x-1/2">
            <Logo color="ink" height={scrolled ? 26 : 32} priority className="transition-all duration-300 max-lg:!h-[26px]" />
          </Link>

          <div className="flex items-center gap-1 lg:gap-4">
            <Link href="/account/wishlist" aria-label="Wishlist" className="hidden h-11 w-11 items-center justify-center hover:text-olive lg:flex">
              <svg {...icon} aria-hidden="true">
                <path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z" />
              </svg>
            </Link>
            <Link href="/login" aria-label="Account" className="hidden h-11 w-11 items-center justify-center hover:text-olive lg:flex">
              <svg {...icon} aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </Link>
            <button type="button" aria-label="Bag, 0 items" className="relative -mr-3 flex h-11 w-11 items-center justify-center hover:text-olive lg:mr-0">
              <svg {...icon} aria-hidden="true">
                <path d="M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 016 0v2" />
              </svg>
              <span className="absolute right-0.5 top-1 text-xs">0</span>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-cream" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="container-page flex h-20 items-center justify-between">
            <button type="button" className="-ml-3 flex h-11 w-11 items-center justify-center" aria-label="Close menu" onClick={() => setOpen(false)}>
              <svg {...icon} aria-hidden="true">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
            <Logo color="ink" height={26} />
            <span className="w-11" />
          </div>
          <nav className="container-page flex flex-1 flex-col justify-center gap-6" aria-label="Mobile">
            {[...navLinks, { href: "/login", label: "Account" }, { href: "/account/wishlist", label: "Wishlist" }].map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-display text-4xl hover:text-olive">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
