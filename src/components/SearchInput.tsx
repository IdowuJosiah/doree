"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { framingStyle } from "@/lib/framing";

type Suggestion = {
  products: { name: string; slug: string; price: number; soldOut: boolean; image: { src: string; position?: string } | null }[];
  total: number;
  groups: { name: string; href: string; kind: string }[];
};

// The search box: focuses itself when empty (so the header search icon lets
// you type straight away), and shows matching pieces, categories and
// collections as you type. Enter still opens the full results.
export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [data, setData] = useState<Suggestion | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const latest = useRef("");

  useEffect(() => {
    if (defaultValue) return;
    // After a page change Next.js moves focus itself; focus just after it.
    const t = setTimeout(() => ref.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [defaultValue]);

  // Fetch suggestions a moment after typing stops.
  useEffect(() => {
    const q = value.trim();
    latest.current = q;
    if (q.length < 2) {
      setData(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as Suggestion;
        if (latest.current === q) {
          setData(json);
          setActive(-1);
        }
      } catch {
        // Suggestions are a nicety; the full search still works.
      }
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  const links = [
    ...(data?.groups ?? []).map((g) => g.href),
    ...(data?.products ?? []).map((p) => `/product/${p.slug}`),
  ];
  const showList = open && value.trim().length >= 2 && data !== null;
  const empty = data !== null && data.products.length === 0 && data.groups.length === 0;

  return (
    <div className="relative flex-1">
      <input
        ref={ref}
        id="q"
        name="q"
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!showList || empty) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, links.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, -1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            router.push(links[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Hoops, gold, necklace…"
        enterKeyHint="search"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className="field !h-12 w-full"
      />

      {showList && (
        <div id={listId} role="listbox" aria-label="Suggestions" className="absolute inset-x-0 top-full z-30 mt-1 max-h-[70vh] overflow-y-auto border border-line bg-cream shadow-lg">
          {empty ? (
            <p className="px-4 py-3 text-sm opacity-70">No pieces match “{value.trim()}” yet.</p>
          ) : (
            <>
              {data!.groups.map((g, i) => (
                <Link
                  key={g.href}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={active === i}
                  href={g.href}
                  className={`label flex min-h-[44px] items-center px-4 hover:bg-cream-deep ${active === i ? "bg-cream-deep" : ""}`}
                >
                  {g.kind === "collection" ? `The ${g.name} collection` : `All ${g.name}`}
                </Link>
              ))}
              {data!.products.map((p, j) => {
                const i = data!.groups.length + j;
                return (
                  <Link
                    key={p.slug}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    href={`/product/${p.slug}`}
                    className={`flex items-center gap-3 px-4 py-2 hover:bg-cream-deep ${active === i ? "bg-cream-deep" : ""}`}
                  >
                    <span className="relative h-14 w-11 shrink-0 overflow-hidden bg-cream-deep" style={{ borderRadius: "9999px 9999px 0 0" }}>
                      {p.image && <Image src={p.image.src} alt="" fill sizes="44px" style={framingStyle(p.image.position)} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="shrink-0 text-sm">{p.soldOut ? "Sold out" : formatPrice(p.price)}</span>
                  </Link>
                );
              })}
              {data!.total > data!.products.length && (
                <button type="submit" className="label w-full border-t border-line px-4 py-3 text-left text-gold-text hover:bg-cream-deep">
                  See all {data!.total} results
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
