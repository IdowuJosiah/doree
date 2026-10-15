import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/data/catalog";
import { Shaped } from "./Shaped";
import { WishlistButton } from "./store/WishlistButton";

export function ProductCard({ product }: { product: Product }) {
  const [first, second] = product.images;
  return (
    <article className="group zoom relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative">
          <Shaped image={first} shape="arch" />
          {second?.src && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Shaped image={second} shape="arch" />
            </div>
          )}
        </div>
        <h3 className="mt-4 font-sans text-base">{product.name}</h3>
        <p className="text-sm">{product.soldOut ? "Sold out" : formatPrice(product.price)}</p>
      </Link>
      {/* Sits on the bottom corner of the photo; the photo box is always 3:4. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4]">
        <WishlistButton
          productId={product.id}
          name={product.name}
          className="pointer-events-auto absolute bottom-3 right-3 rounded-full bg-[rgba(253,250,244,0.9)]"
        />
      </div>
    </article>
  );
}
