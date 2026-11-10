"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

// A search/filter form that updates the list as you type (after a short
// pause) and as soon as a dropdown changes. Pressing Enter or the button
// still works.
export function LiveSearchForm({ children, className }: { children: React.ReactNode; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function apply(form: HTMLFormElement, delay: number) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      for (const [k, v] of new FormData(form)) if (typeof v === "string" && v.trim()) params.set(k, v.trim());
      const qs = params.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    }, delay);
  }

  return (
    <form
      role="search"
      className={className}
      aria-busy={pending}
      onInput={(e) => apply(e.currentTarget, (e.target as HTMLElement).tagName === "SELECT" ? 0 : 300)}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") apply(e.currentTarget, 0);
      }}
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget, 0);
      }}
    >
      {children}
      <span aria-live="polite" className={`text-xs opacity-70 transition-opacity ${pending ? "opacity-70" : "opacity-0"}`}>
        {pending ? "Searching…" : ""}
      </span>
    </form>
  );
}
