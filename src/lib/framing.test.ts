import { describe, expect, it } from "vitest";
import { formatFraming, framingStyle, parseFraming } from "./framing";

describe("photo framing", () => {
  it("reads old and new values", () => {
    expect(parseFraming("center")).toEqual({ x: 50, y: 50, zoom: 1 });
    expect(parseFraming(undefined)).toEqual({ x: 50, y: 50, zoom: 1 });
    expect(parseFraming("40% 25%")).toEqual({ x: 40, y: 25, zoom: 1 });
    expect(parseFraming("40% 25% 1.6")).toEqual({ x: 40, y: 25, zoom: 1.6 });
  });

  it("keeps values in range", () => {
    expect(parseFraming("140% -5% 9")).toEqual({ x: 100, y: 0, zoom: 3 });
  });

  it("only writes a zoom when the photo is zoomed", () => {
    expect(formatFraming({ x: 40.4, y: 25.6, zoom: 1 })).toBe("40% 26%");
    expect(formatFraming({ x: 40, y: 25, zoom: 1.234 })).toBe("40% 25% 1.23");
  });

  it("scales around the focus point", () => {
    const s = framingStyle("30% 70% 2");
    expect(s.objectPosition).toBe("30% 70%");
    expect(s.transformOrigin).toBe("30% 70%");
    expect(s.transform).toBe("scale(2)");
  });
});
