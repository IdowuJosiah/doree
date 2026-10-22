import type { CSSProperties } from "react";

// How a photo sits in its frame. Stored as text in the existing position
// field: "40% 25%" (focus point) or "40% 25% 1.6" (focus point and zoom).
// Older values such as "center" still work.
export type Framing = { x: number; y: number; zoom: number };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function parseFraming(value?: string | null): Framing {
  const m = (value ?? "").match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%(?:\s+(\d+(?:\.\d+)?))?/);
  if (!m) return { x: 50, y: 50, zoom: 1 };
  return {
    x: clamp(Number(m[1]), 0, 100),
    y: clamp(Number(m[2]), 0, 100),
    zoom: clamp(m[3] ? Number(m[3]) : 1, MIN_ZOOM, MAX_ZOOM),
  };
}

export function formatFraming({ x, y, zoom }: Framing): string {
  const pos = `${Math.round(x)}% ${Math.round(y)}%`;
  const z = Math.round(zoom * 100) / 100;
  return z > 1 ? `${pos} ${z}` : pos;
}

/** Inline style for an <img> that fills its frame with object-fit: cover. */
export function framingStyle(value?: string | null): CSSProperties {
  const { x, y, zoom } = parseFraming(value);
  const origin = `${x}% ${y}%`;
  // --zoom is read by the .shape img rule so hover effects still apply.
  return { objectFit: "cover", objectPosition: origin, transformOrigin: origin, ["--zoom" as string]: zoom, transform: `scale(${zoom})` };
}
