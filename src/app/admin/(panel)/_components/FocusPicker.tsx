"use client";

import { useState } from "react";

const parse = (v: string): [number, number] => {
  const m = v.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  return m ? [Number(m[1]), Number(m[2])] : [50, 50];
};

// Click the photo to choose the point the arch crop keeps in view. The value
// is saved as the image's object_position (for example "40% 25%").
export function FocusPicker({ src, initial, name = "object_position" }: { src: string; initial: string; name?: string }) {
  const [[x, y], setPoint] = useState<[number, number]>(parse(initial));
  const [broken, setBroken] = useState(false);
  const value = `${x}% ${y}%`;

  return (
    <div className="flex flex-wrap items-start gap-4">
      <input type="hidden" name={name} value={value} />
      {broken && (
        <p role="alert" className="w-full border border-red-800 px-3 py-2 text-sm text-red-800">
          This photo cannot be displayed (often an iPhone HEIC file). Delete it and upload it again; the uploader now converts it automatically.
        </p>
      )}
      <div>
        <p className="label mb-1">Focus point</p>
        <button
          type="button"
          aria-label="Set focus point"
          className="relative block cursor-crosshair"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setPoint([
              Math.round(((e.clientX - r.left) / r.width) * 100),
              Math.round(((e.clientY - r.top) / r.height) * 100),
            ]);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="block max-h-48 w-auto" onError={() => setBroken(true)} />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cream bg-olive"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        </button>
      </div>
      <div>
        <p className="label mb-1">Arch preview</p>
        <div className="h-48 overflow-hidden bg-cream-deep" style={{ aspectRatio: "3 / 4", borderRadius: "9999px 9999px 0 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: value }} />
        </div>
      </div>
    </div>
  );
}
