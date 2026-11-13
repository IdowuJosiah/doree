import { describe, expect, it } from "vitest";
import { endOfShopDay, shopDate } from "./shop-time";

describe("shop time (US Central)", () => {
  it("ends the day at 11:59:59 pm Central, standard and daylight time", () => {
    expect(endOfShopDay("2026-12-24").toISOString()).toBe("2026-12-25T05:59:59.000Z"); // CST, UTC-6
    expect(endOfShopDay("2026-07-04").toISOString()).toBe("2026-07-05T04:59:59.000Z"); // CDT, UTC-5
  });

  it("handles the days the clocks change", () => {
    expect(endOfShopDay("2026-03-08").toISOString()).toBe("2026-03-09T04:59:59.000Z"); // spring forward
    expect(endOfShopDay("2026-11-01").toISOString()).toBe("2026-11-02T05:59:59.000Z"); // fall back
  });

  it("shows the same calendar day back", () => {
    expect(shopDate(endOfShopDay("2026-12-24").toISOString())).toBe("Dec 24, 2026");
    expect(shopDate(endOfShopDay("2026-07-04").toISOString())).toBe("Jul 4, 2026");
  });
});
