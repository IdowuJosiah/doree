"use client";

import { useWishlist } from "./Wishlist";

export function WishlistButton({ productId, name, className = "" }: { productId: string; name: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        toggle(productId, name);
      }}
      className={`flex h-11 w-11 items-center justify-center hover:text-olive ${saved ? "text-olive" : "text-ink"} ${className}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z" />
      </svg>
    </button>
  );
}
