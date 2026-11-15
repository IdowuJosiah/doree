// USPS package tracking. Dorée ships with USPS, so a tracking number is all
// an order needs; customers follow it on the USPS site.

/**
 * A tracking number as typed (spaces, dashes, lower case) cleaned up, or ""
 * when blank. Throws when it cannot be a USPS number.
 */
export function cleanTrackingNumber(raw: string): string {
  const n = raw.replace(/[\s-]+/g, "").toUpperCase();
  if (!n) return "";
  if (!/^[A-Z0-9]{10,40}$/.test(n)) throw new Error("That doesn't look like a USPS tracking number (10 to 40 letters and numbers).");
  return n;
}

export const uspsTrackingUrl = (n: string) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`;
