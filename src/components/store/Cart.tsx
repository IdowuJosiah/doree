"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ProductImage } from "@/lib/data/catalog";
import { MAX_QUANTITY_PER_LINE } from "@/lib/pricing";
import { load, save } from "./storage";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string;
  /** Cents, for display only. Checkout recalculates every price on the server. */
  price: number;
  image?: ProductImage;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const KEY = "doree-cart";
const CartContext = createContext<CartState | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

const clamp = (n: number) => Math.max(1, Math.min(MAX_QUANTITY_PER_LINE, Math.floor(n)));

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    setItems(load<CartItem[]>(KEY, []).filter((i) => i && typeof i.variantId === "string" && i.quantity > 0));
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) save(KEY, items);
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) return prev.map((i) => (i.variantId === item.variantId ? { ...i, quantity: clamp(i.quantity + quantity) } : i));
      return [...prev, { ...item, quantity: clamp(quantity) }];
    });
    setOpen(true);
  }, []);

  const value = useMemo<CartState>(
    () => ({
      items,
      ready,
      isOpen,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQuantity: (variantId, quantity) =>
        setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, quantity: clamp(quantity) } : i))),
      remove: (variantId) => setItems((prev) => prev.filter((i) => i.variantId !== variantId)),
      clear: () => setItems([]),
    }),
    [items, ready, isOpen, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
