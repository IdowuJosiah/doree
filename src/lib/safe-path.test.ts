import { describe, expect, it } from "vitest";
import { safePath } from "./safe-path";

describe("safePath", () => {
  it("keeps paths on this site", () => {
    expect(safePath("/account", "/")).toBe("/account");
    expect(safePath("/account/orders?x=1#top", "/")).toBe("/account/orders?x=1#top");
    expect(safePath("/admin/products", "/admin", "/admin")).toBe("/admin/products");
  });

  it("refuses anything a browser could send to another site", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "/\\/evil.com", "https://evil.com", "evil.com", "\t/x", "/x\u0000", ""]) {
      expect(safePath(bad, "/fallback")).toBe("/fallback");
    }
    expect(safePath(null, "/fallback")).toBe("/fallback");
    // Encoded characters stay encoded and on this site, so they are harmless.
    expect(safePath("/%0d%0aSet-Cookie:x", "/fallback")).toBe("/%0d%0aSet-Cookie:x");
  });

  it("can require a prefix", () => {
    expect(safePath("/account", "/admin", "/admin")).toBe("/admin");
    expect(safePath("/admin/../account", "/admin", "/admin")).toBe("/admin");
  });
});
