"use client";

import { useRef, useState } from "react";
import { formatFraming, framingStyle, MAX_ZOOM, MIN_ZOOM, parseFraming, type Framing } from "@/lib/framing";

export type FrameShape = "arch" | "quarter" | "quarter-mirror" | "rect";

const radius: Record<FrameShape, string> = {
  arch: "9999px 9999px 0 0",
  quarter: "9999px 0 0 0",
  "quarter-mirror": "0 9999px 0 0",
  rect: "0",
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// Frame a photo for the shop: drag it inside the preview to move it, and use
// the slider to zoom in. The result is saved in the form field `name`
// (for example "40% 25% 1.6"); see src/lib/framing.ts.
export function FocusPicker({ src, initial, name = "object_position", shape = "arch" }: { src: string; initial: string; name?: string; shape?: FrameShape }) {
  const [frame, setFrame] = useState<Framing>(parseFraming(initial));
  const [broken, setBroken] = useState(false);
  const drag = useRef<{ x: number; y: number; start: Framing; w: number; h: number } | null>(null);
  const value = formatFraming(frame);
  const set = (f: Partial<Framing>) => setFrame((cur) => ({ ...cur, ...f }));

  return (
    <div className="flex flex-wrap items-start gap-6">
      <input type="hidden" name={name} value={value} />
      {broken && (
        <p role="alert" className="w-full border border-red-800 px-3 py-2 text-sm text-red-800">
          This photo cannot be displayed (often an iPhone HEIC file). Delete it and upload it again; the uploader now converts it automatically.
        </p>
      )}

      <div>
        <p className="label mb-1">How it looks on the shop</p>
        <div
          className="relative h-64 cursor-grab touch-none select-none overflow-hidden bg-cream-deep active:cursor-grabbing"
          style={{ aspectRatio: "3 / 4", borderRadius: radius[shape] }}
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, start: frame, w: r.width, h: r.height };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            // Dragging the photo right shows more of its left side.
            set({
              x: clamp(d.start.x - ((e.clientX - d.x) / d.w) * (100 / d.start.zoom), 0, 100),
              y: clamp(d.start.y - ((e.clientY - d.y) / d.h) * (100 / d.start.zoom), 0, 100),
            });
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" draggable={false} className="pointer-events-none h-full w-full" style={framingStyle(value)} onError={() => setBroken(true)} />
        </div>
        <p className="mt-1 text-xs opacity-70">Drag the photo to move it.</p>
      </div>

      <div className="min-w-[14rem] flex-1 space-y-4">
        <div>
          <label htmlFor={`${name}-zoom-${src}`} className="label mb-1 block">Zoom</label>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Zoom out" onClick={() => set({ zoom: clamp(frame.zoom - 0.1, MIN_ZOOM, MAX_ZOOM) })} className="flex h-9 w-9 items-center justify-center border border-line text-lg">−</button>
            <input
              id={`${name}-zoom-${src}`}
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={frame.zoom}
              onChange={(e) => set({ zoom: Number(e.target.value) })}
              className="w-40 accent-[var(--gold-text)]"
            />
            <button type="button" aria-label="Zoom in" onClick={() => set({ zoom: clamp(frame.zoom + 0.1, MIN_ZOOM, MAX_ZOOM) })} className="flex h-9 w-9 items-center justify-center border border-line text-lg">+</button>
            <span className="w-12 text-sm tabular-nums">{frame.zoom.toFixed(1)}×</span>
          </div>
        </div>

        <div>
          <p className="label mb-1">Whole photo</p>
          <button
            type="button"
            aria-label="Click to choose the centre of the frame"
            className="relative block cursor-crosshair"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              set({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="block max-h-32 w-auto" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cream bg-gold-text"
              style={{ left: `${frame.x}%`, top: `${frame.y}%` }}
            />
          </button>
          <p className="mt-1 text-xs opacity-70">Or click here to choose the centre.</p>
        </div>

        <button type="button" onClick={() => setFrame({ x: 50, y: 50, zoom: 1 })} className="text-link text-sm">Reset</button>
      </div>
    </div>
  );
}
