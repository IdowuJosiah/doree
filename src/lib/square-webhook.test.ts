import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { handlePaymentEvent, verifySquareSignature, type SquarePaymentEvent, type WebhookDeps } from "./square-webhook";

const ORDER_ID = "0b8a3c1e-5d7f-4a62-9c1d-2f4e6a8b0c3d";
const event = (over: Partial<NonNullable<SquarePaymentEvent["data"]>["object"]> & { type?: string } = {}, payment = {}): SquarePaymentEvent => ({
  type: over.type ?? "payment.updated",
  data: { object: { payment: { id: "pay_1", status: "COMPLETED", reference_id: ORDER_ID, amount_money: { amount: 7600, currency: "USD" }, ...payment } } },
});

const deps = (over: Partial<WebhookDeps> = {}): WebhookDeps => ({
  currency: "USD",
  findOrder: vi.fn(async () => ({ id: ORDER_ID, status: "pending", total: 7600, square_payment_id: null as string | null })),
  markPaid: vi.fn(async () => true),
  ...over,
});

describe("verifySquareSignature", () => {
  const url = "https://example.com/api/webhooks/square";
  const body = JSON.stringify({ type: "payment.updated" });
  const sign = (key: string) => createHmac("sha256", key).update(url + body).digest("base64");

  it("accepts a correct signature", () => expect(verifySquareSignature(body, sign("k"), "k", url)).toBe(true));
  it("rejects a wrong key, a changed body, a different url and a missing header", () => {
    expect(verifySquareSignature(body, sign("other"), "k", url)).toBe(false);
    expect(verifySquareSignature(body + " ", sign("k"), "k", url)).toBe(false);
    expect(verifySquareSignature(body, sign("k"), "k", url + "/x")).toBe(false);
    expect(verifySquareSignature(body, null, "k", url)).toBe(false);
  });
});

describe("handlePaymentEvent", () => {
  it("marks a completed payment paid with its payment id", async () => {
    const d = deps();
    expect(await handlePaymentEvent(event(), d)).toBe("paid");
    expect(d.markPaid).toHaveBeenCalledWith(ORDER_ID, "pay_1");
  });

  it("leaves the order untouched for failed, cancelled or pending payments", async () => {
    for (const status of ["FAILED", "CANCELED", "PENDING", "APPROVED"]) {
      const d = deps();
      expect(await handlePaymentEvent(event({}, { status }), d)).toBe("ignored");
      expect(d.markPaid).not.toHaveBeenCalled();
    }
  });

  it("ignores other event types and unrelated reference ids", async () => {
    const d = deps();
    expect(await handlePaymentEvent(event({ type: "refund.updated" }), d)).toBe("ignored");
    expect(await handlePaymentEvent(event({}, { reference_id: "not-a-uuid" }), d)).toBe("ignored");
    expect(d.markPaid).not.toHaveBeenCalled();
  });

  it("refuses to mark paid when the amount or currency differs from the order", async () => {
    const d = deps();
    expect(await handlePaymentEvent(event({}, { amount_money: { amount: 100, currency: "USD" } }), d)).toBe("amount_mismatch");
    expect(await handlePaymentEvent(event({}, { amount_money: { amount: 7600, currency: "EUR" } }), d)).toBe("amount_mismatch");
    expect(d.markPaid).not.toHaveBeenCalled();
  });

  it("reports unknown orders and repeat deliveries", async () => {
    expect(await handlePaymentEvent(event(), deps({ findOrder: async () => null }))).toBe("unknown_order");
    const paid = { id: ORDER_ID, status: "paid", total: 7600, square_payment_id: "pay_1" };
    expect(await handlePaymentEvent(event(), deps({ findOrder: async () => paid }))).toBe("already_processed");
    // Two deliveries racing: the order looked pending, but the other one marked it paid first.
    const raced = deps({ markPaid: async () => false });
    vi.mocked(raced.findOrder).mockResolvedValueOnce({ ...paid, status: "pending", square_payment_id: null }).mockResolvedValueOnce(paid);
    expect(await handlePaymentEvent(event(), raced)).toBe("already_processed");
  });

  it("flags a second payment for an order that is already paid or was cancelled", async () => {
    const d = deps({ findOrder: async () => ({ id: ORDER_ID, status: "paid", total: 7600, square_payment_id: "pay_0" }) });
    expect(await handlePaymentEvent(event(), d)).toBe("unexpected_payment");
    expect(d.markPaid).not.toHaveBeenCalled();
    const cancelled = deps({ findOrder: async () => ({ id: ORDER_ID, status: "cancelled", total: 7600, square_payment_id: null }) });
    expect(await handlePaymentEvent(event(), cancelled)).toBe("unexpected_payment");
  });
});
