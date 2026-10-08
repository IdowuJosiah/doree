"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { wishlistProducts } from "@/app/(site)/wishlist-actions";
import type { Product } from "@/lib/data/catalog";
import { ProductCard } from "../ProductCard";
import { useWishlist } from "./Wishlist";

export function WishlistGrid() {
  const { ids, ready } = useWishlist();
  const [products, setProducts] = useState<Product[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!ready) return;
    if (!key) return setProducts([]);
    wishlistProducts(key.split(",")).then(setProducts).catch(() => setProducts([]));
  }, [ready, key]);

  if (!products) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse bg-cream-deep" style={{ borderRadius: "9999px 9999px 0 0" }} />)}
      </div>
    );
  }
  const shown = products.filter((p) => ids.includes(p.id));
  if (shown.length === 0) {
    return (
      <div className="mt-10">
        <p>Your wishlist is empty. Tap the heart on any piece to save it here.</p>
        <Link href="/shop" className="btn-outline mt-6">Shop now</Link>
      </div>
    );
  }
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
      {shown.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
