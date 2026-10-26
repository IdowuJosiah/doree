"use client";

import { useEffect, useRef } from "react";

// The search box focuses itself when empty, so arriving from the header
// search icon lets you type straight away (and opens the keyboard on phones).
export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (defaultValue) return;
    // After a page change Next.js moves focus itself; focus just after it.
    const t = setTimeout(() => ref.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [defaultValue]);
  return (
    <input
      ref={ref}
      id="q"
      name="q"
      type="search"
      defaultValue={defaultValue}
      placeholder="Hoops, gold, necklace…"
      enterKeyHint="search"
      className="field !h-12 flex-1"
    />
  );
}
