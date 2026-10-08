"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";
import { MAX_QUANTITY_PER_LINE } from "@/lib/pricing";
import { useCart } from "./Cart";

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove, subtotal, count } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close bag" tabIndex={-1} className="absolute inset-0 bg-[rgba(30,26,18,0.35)]" onClick={close} />
      <aside role="dialog" aria-modal="true" aria-label="Your bag" className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-cream">
        <div className="flex h-20 items-center justify-between border-b border-line px-6">
          <h2 className="font-display text-2xl">Your bag {count > 0 && <span className="font-sans text-base">({count})</span>}</h2>
          <button ref={closeRef} type="button" onClick={close} aria-label="Close bag" className="-mr-3 flex h-11 w-11 items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p className="font-display text-2xl">Your bag is empty.</p>
            <Link href="/shop" onClick={close} className="btn-outline">Shop now</Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((i) => (
                <li key={i.variantId} className="flex gap-4 py-5">
                  <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden bg-cream-deep" style={{ borderRadius: "9999px 9999px 0 0" }}>
                    {i.image?.src && (
                      <Image src={i.image.src} alt={i.image.alt} fill sizes="72px" className="object-cover" style={{ objectPosition: i.image.objectPosition ?? "center" }} />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/product/${i.slug}`} onClick={close} className="hover:text-olive">{i.name}</Link>
                    {i.variantLabel !== "One size" && <p className="text-sm opacity-70">{i.variantLabel}</p>}
                    <p className="text-sm">{formatPrice(i.price)}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center border border-line">
                        <button type="button" aria-label={`Decrease quantity of ${i.name}`} disabled={i.quantity <= 1} onClick={() => setQuantity(i.variantId, i.quantity - 1)} className="h-11 w-11 disabled:opacity-30">−</button>
                        <span aria-live="polite" className="w-8 text-center">{i.quantity}</span>
                        <button type="button" aria-label={`Increase quantity of ${i.name}`} disabled={i.quantity >= MAX_QUANTITY_PER_LINE} onClick={() => setQuantity(i.variantId, i.quantity + 1)} className="h-11 w-11 disabled:opacity-30">+</button>
                      </div>
                      <button type="button" onClick={() => remove(i.variantId)} className="text-link min-h-[44px] text-sm">Remove</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-6 py-6">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <p className="mt-1 text-sm opacity-70">Shipping calculated at checkout</p>
              <Link href="/checkout" onClick={close} className="btn-primary mt-5 w-full">Checkout</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
