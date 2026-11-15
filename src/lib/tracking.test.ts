import { describe, expect, it } from "vitest";
import { cleanTrackingNumber, uspsTrackingUrl } from "./tracking";

describe("USPS tracking", () => {
  it("cleans up what is typed", () => {
    expect(cleanTrackingNumber(" 9400 1000 0000 0000 0000 00 ")).toBe("9400100000000000000000");
    expect(cleanTrackingNumber("ea123456789us")).toBe("EA123456789US");
    expect(cleanTrackingNumber("9400-1000-0000")).toBe("940010000000");
    expect(cleanTrackingNumber("")).toBe("");
  });

  it("refuses things that are not tracking numbers", () => {
    expect(() => cleanTrackingNumber("123")).toThrow("USPS tracking number");
    expect(() => cleanTrackingNumber("<script>")).toThrow();
  });

  it("links to the USPS tracking page", () => {
    expect(uspsTrackingUrl("9400100000000000000000")).toBe("https://tools.usps.com/go/TrackConfirmAction?tLabels=9400100000000000000000");
  });
});
