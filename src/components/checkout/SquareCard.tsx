"use client";

import { useEffect, useRef, useState } from "react";

type SquareCardInstance = { attach: (selector: string) => Promise<void>; tokenize: () => Promise<{ status: string; token?: string; errors?: { message: string }[] }>; destroy: () => Promise<void> };
type SquareGlobal = { payments: (appId: string, locationId: string) => { card: () => Promise<SquareCardInstance> } };

declare global {
  interface Window {
    Square?: SquareGlobal;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.Square) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    const el = existing ?? document.createElement("script");
    el.addEventListener("load", () => resolve());
    el.addEventListener("error", () => reject(new Error("Could not load the card form.")));
    if (!existing) {
      el.src = src;
      el.async = true;
      document.head.appendChild(el);
    }
  });
}

/** Square Web Payments card field. The card details never touch this site. */
export function SquareCard({
  appId,
  locationId,
  sandbox,
  onReady,
}: {
  appId: string;
  locationId: string;
  sandbox: boolean;
  onReady: (tokenize: () => Promise<string>) => void;
}) {
  const [error, setError] = useState("");
  const card = useRef<SquareCardInstance | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadScript(sandbox ? "https://sandbox.web.squarecdn.com/v1/square.js" : "https://web.squarecdn.com/v1/square.js");
        if (cancelled || !window.Square) return;
        const instance = await window.Square.payments(appId, locationId).card();
        await instance.attach("#square-card");
        if (cancelled) return void instance.destroy();
        card.current = instance;
        onReady(async () => {
          const result = await instance.tokenize();
          if (result.status !== "OK" || !result.token) throw new Error(result.errors?.[0]?.message ?? "Please check your card details.");
          return result.token;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load the card form.");
      }
    })();
    return () => {
      cancelled = true;
      void card.current?.destroy();
    };
  }, [appId, locationId, sandbox, onReady]);

  return (
    <div>
      <div id="square-card" className="min-h-[90px]" />
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
    </div>
  );
}
