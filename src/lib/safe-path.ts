/**
 * A "where to go next" value from a link or form, reduced to a path on this
 * site, or the fallback. Rejects anything a browser could read as another
 * site: "//evil.com", "/\evil.com", "https://evil.com", control characters.
 */
export function safePath(next: string | null | undefined, fallback: string, mustStartWith = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) return fallback;
  try {
    const base = "https://same-site.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    const path = url.pathname + url.search + url.hash;
    return path.startsWith(mustStartWith) ? path : fallback;
  } catch {
    return fallback;
  }
}
