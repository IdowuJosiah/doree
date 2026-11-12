"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// After a save, the page reloads at the top and the "Saved" notice is up
// there too. This remembers which form was submitted, scrolls back to it and
// shows the result right under it, wherever it is on the page.

const KEY = "admin-last-form";
type Last = { path: string; index: number; y: number; at: number };
type Flash = { top: number; left: number; text: string; error: boolean };

function message(params: URLSearchParams): { text: string; error: boolean } | null {
  const error = params.get("error");
  if (error) return { text: error, error: true };
  if (params.get("published")) return { text: "Published ✓", error: false };
  if (params.get("unpublished")) return { text: "Unpublished ✓", error: false };
  if (params.get("removed")) return { text: "Deleted ✓", error: false };
  if (params.get("saved")) return { text: "Saved ✓", error: false };
  return null;
}

export function SaveFlash() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [flash, setFlash] = useState<Flash | null>(null);

  // Remember the form being submitted (searches are skipped: they never "save").
  useEffect(() => {
    const onSubmit = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || form.getAttribute("role") === "search") return;
      setFlash(null);
      const index = Array.from(document.querySelectorAll("form")).indexOf(form);
      const last: Last = { path: window.location.pathname, index, y: window.scrollY, at: Date.now() };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(last));
      } catch {}
    };
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, []);

  useEffect(() => {
    const msg = message(params);
    if (!msg) return;
    let last: Last | null = null;
    try {
      last = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
      sessionStorage.removeItem(KEY);
    } catch {}
    // Only for a submit made on this page in the last minute.
    if (!last || last.path !== pathname || Date.now() - last.at > 60_000) return;

    const t = setTimeout(() => {
      const form = document.querySelectorAll("form")[last.index];
      if (!form) {
        window.scrollTo({ top: last.y });
        return;
      }
      form.scrollIntoView({ block: "center" });
      const r = form.getBoundingClientRect();
      setFlash({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX, ...msg });
    }, 50);
    const hide = setTimeout(() => setFlash(null), msg.error ? 10_000 : 4_000);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, [params, pathname]);

  if (!flash) return null;
  return (
    <div
      role={flash.error ? "alert" : "status"}
      className={`absolute z-50 max-w-sm px-3 py-1.5 text-sm shadow-sm ${flash.error ? "border border-red-800 bg-cream text-red-800" : "bg-gold text-ink"}`}
      style={{ top: flash.top, left: flash.left }}
    >
      {flash.text}
    </div>
  );
}
