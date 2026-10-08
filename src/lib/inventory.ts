/** A variant at or below this many units is flagged as low stock. */
export const LOW_STOCK = 3;

export type StockLevel = "out" | "low" | "ok";

export const stockLevel = (stock: number): StockLevel => (stock <= 0 ? "out" : stock <= LOW_STOCK ? "low" : "ok");

export type StockChange = { id: string; from: number; to: number };

/**
 * Reads `stock:<id>` (new value) and `orig:<id>` (value shown on screen) pairs
 * from the inventory form. Returns only rows that changed, or an error message.
 */
export function parseStockChanges(form: Iterable<[string, FormDataEntryValue]>): StockChange[] | string {
  const entries = new Map<string, string>();
  for (const [k, v] of form) entries.set(k, String(v));
  const changes: StockChange[] = [];
  for (const [key, raw] of entries) {
    if (!key.startsWith("stock:")) continue;
    const id = key.slice("stock:".length);
    const to = raw.trim() === "" ? NaN : Number(raw);
    const from = Number(entries.get(`orig:${id}`));
    if (!Number.isInteger(to) || to < 0) return "Stock must be a whole number of 0 or more.";
    if (!Number.isInteger(from)) return "The inventory screen was out of date. Reload and try again.";
    if (to !== from) changes.push({ id, from, to });
  }
  return changes;
}
