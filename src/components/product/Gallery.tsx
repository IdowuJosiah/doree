"use client";

import { useCallback, useRef, useState } from "react";
import type { ProductImage } from "@/lib/data/catalog";
import { Shaped } from "../Shaped";

const chevron = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5 } as const;

// One image at a time. Swipe (touch or trackpad), the arrows, the dots or the
// keyboard arrow keys move between images; scroll snapping does the sliding.
export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = images.length > 1;

  const go = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(images.length - 1, i));
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, [images.length]);

  const arrow = "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(253,250,244,0.9)] text-ink shadow-sm transition hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink";

  return (
    <div>
      <div className="relative">
        <div
          ref={track}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="region"
          aria-roledescription="carousel"
          aria-label={`${name} images`}
          tabIndex={many ? 0 : undefined}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
            if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
          }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="w-full shrink-0 snap-center"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${images.length}`}
            >
              <Shaped image={img} shape="arch" priority={i === 0} sizes="(min-width: 1024px) 45vw, 100vw" />
            </div>
          ))}
        </div>

        {many && index > 0 && (
          <button type="button" aria-label="Previous image" onClick={() => go(index - 1)} className={`${arrow} left-3`}>
            <svg {...chevron} aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
        )}
        {many && index < images.length - 1 && (
          <button type="button" aria-label="Next image" onClick={() => go(index + 1)} className={`${arrow} right-3`}>
            <svg {...chevron} aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>

      {many && (
        <div className="mt-4 flex items-center justify-center gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className="flex h-7 w-7 items-center justify-center"
            >
              <span className={`block h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-ink" : "w-1.5 bg-line"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
