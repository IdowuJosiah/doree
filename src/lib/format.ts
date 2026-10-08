import { siteConfig } from "./config";

const formatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
});

/** Prices are stored in cents and formatted only for display. */
export const formatPrice = (cents: number) => formatter.format(cents / 100);

/** Parses a dollar amount typed by an admin ("12.50") into cents. */
export function dollarsToCents(input: string): number {
  const n = Number(input.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid amount: ${input}`);
  return Math.round(n * 100);
}

export const centsToDollars = (cents: number) => (cents / 100).toFixed(2);
