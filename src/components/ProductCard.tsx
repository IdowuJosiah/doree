import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/products";
import { Shaped } from "./Shaped";

export function ProductCard({ product }: { product: Product }) {
  const [first, second] = product.images;
  return (
    <article className="group zoom relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative">
          <Shaped image={first} shape="arch" />
          {second && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Shaped image={second} shape="arch" />
            </div>
          )}
        </div>
        <h3 className="mt-4 font-sans text-base">{product.name}</h3>
        <p className="text-sm">{product.soldOut ? "Sold out" : formatPrice(product.price)}</p>
      </Link>
      <button
        type="button"
        aria-label={`Save ${product.name} to wishlist`}
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center text-ink hover:text-olive"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z" />
        </svg>
      </button>
    </article>
  );
}
