"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { setWishlisted, syncWishlist } from "@/app/(site)/wishlist-actions";
import { load, save } from "./storage";
import { useToast } from "./Toast";

type WishlistState = {
  ids: string[];
  ready: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string, name: string) => void;
};

const KEY = "doree-wishlist";
const WishlistContext = createContext<WishlistState | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}

// Guests keep their wishlist in this browser. Once signed in, it is merged
// into their account and kept in the database from then on.
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const signedIn = useRef(false);
  const toast = useToast();

  useEffect(() => {
    const local = load<string[]>(KEY, []);
    setIds(local);
    setReady(true);
    syncWishlist(local)
      .then((server) => {
        if (server) {
          signedIn.current = true;
          setIds(server);
        }
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (ready) save(KEY, ids);
  }, [ids, ready]);

  const toggle = useCallback(
    (productId: string, name: string) => {
      setIds((prev) => {
        const on = !prev.includes(productId);
        toast(on ? `${name} saved to wishlist` : `${name} removed from wishlist`);
        if (signedIn.current) void setWishlisted(productId, on).catch(() => {});
        return on ? [...prev, productId] : prev.filter((id) => id !== productId);
      });
    },
    [toast],
  );

  const value = useMemo<WishlistState>(() => ({ ids, ready, has: (id) => ids.includes(id), toggle }), [ids, ready, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
