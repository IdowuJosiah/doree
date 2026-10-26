import { describe, expect, it } from "vitest";
import { searchTerms } from "./catalog";

describe("searchTerms", () => {
  it("keeps letters and numbers only, in lower case", () => {
    expect(searchTerms("  Gold HOOPS ")).toEqual(["gold", "hoops"]);
    expect(searchTerms("18k, 'Sol' (hoops)%")).toEqual(["18k", "sol", "hoops"]);
    expect(searchTerms("Dorée")).toEqual(["dorée"]);
  });

  it("drops single letters, stray dashes and anything past five words", () => {
    expect(searchTerms("a - ring")).toEqual(["ring"]);
    expect(searchTerms("one two three four five six")).toHaveLength(5);
    expect(searchTerms("%_*,.")).toEqual([]);
  });
});
