"use client";

import { CartProvider } from "./Cart";
import { CartDrawer } from "./CartDrawer";
import { ToastProvider } from "./Toast";
import { WishlistProvider } from "./Wishlist";

export function StoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <WishlistProvider>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </WishlistProvider>
    </ToastProvider>
  );
}
