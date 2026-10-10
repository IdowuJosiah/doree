import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./send";
import { contactAlert, customerConfirmation, escapeHtml, newOrderAlert, type EmailOrder } from "./templates";

const order: EmailOrder = {
  id: "0b8a3c1e-5d7f-4a62-9c1d-2f4e6a8b0c3d",
  number: 1001,
  name: 'Ada <script>alert("x")</script> Lovelace',
  email: "ada@example.com",
  address: { line1: "1 Main St", city: "Austin", state: "TX", postalCode: "78701" },
  subtotal: 13600,
  shippingFee: 1500,
  total: 15100,
  items: [{ name: "Odette Chain (16\")", price: 6800, quantity: 2 }],
};

describe("email templates", () => {
  it("escapes everything a customer typed", () => {
    const { html } = customerConfirmation(order, "https://doree.example");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(escapeHtml(`"'&<>`)).toBe("&quot;&#39;&amp;&lt;&gt;");
  });

  it("shows items and totals from the order", () => {
    const { subject, html, text } = customerConfirmation(order, "https://doree.example");
    expect(subject).toBe("Your Dorée order #1001 is confirmed");
    for (const s of ["$136.00", "$15.00", "$151.00", "Austin, TX 78701"]) {
      expect(html).toContain(s);
      expect(text).toContain(s);
    }
  });

  it("links Dorée's alert to the order in the admin", () => {
    const { subject, html } = newOrderAlert(order, "https://doree.example");
    expect(subject).toBe("New order #1001: $151.00");
    expect(html).toContain(`https://doree.example/admin/orders/${order.id}`);
  });

  it("escapes contact messages", () => {
    expect(contactAlert({ name: "<b>Bo</b>", email: "bo@example.com", message: "<img src=x>" }).html).not.toMatch(/<img src=x>|<b>Bo<\/b>/);
  });
});

describe("sendEmail", () => {
  afterEach(() => vi.unstubAllEnvs());
  const email = { subject: "S", html: "<p>H</p>", text: "T" };

  it("does nothing without a key or from address", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchImpl = vi.fn();
    expect(await sendEmail({ to: "a@b.com", email, fetchImpl })).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts to Resend with the key, sender, reply-to and idempotency key", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Dorée <orders@doree.example>");
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    expect(await sendEmail({ to: "a@b.com", email, replyTo: "owner@doree.example", idempotencyKey: "k1", fetchImpl })).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe("k1");
    expect(JSON.parse(init.body as string)).toMatchObject({ from: "Dorée <orders@doree.example>", to: ["a@b.com"], reply_to: "owner@doree.example", subject: "S" });
  });

  it("returns false instead of throwing when Resend fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "x@y.z");
    expect(await sendEmail({ to: "a@b.com", email, fetchImpl: vi.fn(async () => new Response("bad", { status: 422 })) })).toBe(false);
    expect(await sendEmail({ to: "a@b.com", email, fetchImpl: vi.fn(async () => { throw new Error("network"); }) })).toBe(false);
  });
});
