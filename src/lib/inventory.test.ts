import { describe, expect, it } from "vitest";
import { parseStockChanges, stockLevel } from "./inventory";

const form = (pairs: Record<string, string>) => Object.entries(pairs) as [string, string][];

describe("stockLevel", () => {
  it("flags out, low and ok", () => {
    expect(stockLevel(0)).toBe("out");
    expect(stockLevel(3)).toBe("low");
    expect(stockLevel(4)).toBe("ok");
  });
});

describe("parseStockChanges", () => {
  it("returns only the rows that changed, with the value shown on screen", () => {
    expect(parseStockChanges(form({ "stock:a": "5", "orig:a": "5", "stock:b": "2", "orig:b": "7" }))).toEqual([{ id: "b", from: 7, to: 2 }]);
  });
  it("rejects negative, decimal, blank and non-numeric stock", () => {
    for (const v of ["-1", "1.5", "", "abc"]) {
      expect(typeof parseStockChanges(form({ "stock:a": v, "orig:a": "1" }))).toBe("string");
    }
  });
  it("rejects a missing original value", () => {
    expect(typeof parseStockChanges(form({ "stock:a": "1" }))).toBe("string");
  });
});
