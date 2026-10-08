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
      <WishlistButton productId={product.id} name={product.name} className="absolute right-3 top-3" />
    </article>
  );
}
