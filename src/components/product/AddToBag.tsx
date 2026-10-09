"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/data/catalog";
import { useCart } from "../store/Cart";
import { WishlistButton } from "../store/WishlistButton";

const sizeWord = (labels: string[]) =>
  labels.every((l) => /^\d+(\.\d+)?$/.test(l)) ? "Size" : labels.some((l) => l.includes('"')) ? "Length" : "Option";

export function AddToBag({ product }: { product: Product }) {
  const { add } = useCart();
  const choosable = product.variants.filter((v) => v.label !== "One size" || product.variants.length > 1);
  const firstInStock = product.variants.find((v) => v.stock > 0);
  const [variantId, setVariantId] = useState(firstInStock?.id ?? "");
  const variant = product.variants.find((v) => v.id === variantId);
  const soldOut = product.soldOut || !variant || variant.stock <= 0;
  const word = sizeWord(choosable.map((v) => v.label));

  return (
    <div>
      {choosable.length > 0 && (
        <fieldset className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <legend className="label">{word}{variant && <span className="ml-2 normal-case tracking-normal opacity-70">{variant.label}</span>}</legend>
            {word !== "Option" && <Link href="/guides/size-guide" className="text-link text-sm">Size guide</Link>}
          </div>
          <div className="flex flex-wrap gap-2">
            {choosable.map((v) => {
              const out = v.stock <= 0;
              return (
                <label key={v.id} className={`relative ${out ? "cursor-not-allowed" : "cursor-pointer"}`}>
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={variantId === v.id}
                    disabled={out}
                    onChange={() => setVariantId(v.id)}
                    className="peer sr-only"
                  />
                  <span className={`flex h-11 min-w-[44px] items-center justify-center border px-4 text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-cream peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold-heading ${out ? "border-line line-through opacity-40" : "border-gold hover:border-ink"}`}>
                    {v.label}
                  </span>
                  {out && <span className="sr-only">(sold out)</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Sticks to the bottom of the screen on mobile. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-cream p-4 lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0">
        <button
          type="button"
          disabled={soldOut}
          onClick={() =>
            variant &&
            add({
              variantId: variant.id,
              productId: product.id,
              slug: product.slug,
              name: product.name,
              variantLabel: variant.label,
              price: product.price,
              image: product.images[0],
            })
          }
          className="btn-primary flex-1"
        >
          {soldOut ? "Sold out" : "Add to bag"}
        </button>
        <WishlistButton productId={product.id} name={product.name} className="border border-line !h-auto min-h-[44px] !w-14" />
      </div>
    </div>
  );
}
