"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/data/catalog";
import { Shaped } from "../Shaped";

// Desktop: main arch image with thumbnails beneath. Mobile: swipe between
// images (scroll snap), with dots showing the position.
export function Gallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  return (
    <div>
      <div className="hidden lg:block">
        <Shaped image={images[active]} shape="arch" priority sizes="(min-width: 1024px) 45vw, 100vw" />
        {images.length > 1 && (
          <ul className="mt-4 grid grid-cols-5 gap-3">
            {images.map((img, i) => (
              <li key={i}>
                <button
                  type="button"
                  aria-label={`Show image ${i + 1} of ${images.length}`}
                  aria-current={i === active}
                  onClick={() => setActive(i)}
                  className={`relative block aspect-[3/4] w-full overflow-hidden bg-cream-deep ${i === active ? "outline outline-1 outline-offset-2 outline-ink" : "opacity-70 hover:opacity-100"}`}
                >
                  {img.src && <Image src={img.src} alt="" fill sizes="10vw" className="object-cover" style={{ objectPosition: img.objectPosition ?? "center" }} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="lg:hidden">
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none]"
          aria-label={`${name} images`}
          onScroll={(e) => {
            const el = e.currentTarget;
            setMobileIndex(Math.round(el.scrollLeft / (el.clientWidth + 12)));
          }}
        >
          {images.map((img, i) => (
            <div key={i} className="w-full shrink-0 snap-center">
              <Shaped image={img} shape="arch" priority={i === 0} sizes="100vw" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-2" aria-hidden="true">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === mobileIndex ? "bg-ink" : "bg-line"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
