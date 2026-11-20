import { describe, expect, it, vi } from "vitest";

vi.stubEnv("STRIPE_PRICE_STARTER", "price_starter");
vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
const { planFromPrice } = await import("@/lib/stripe/server");
const { subscriptionFields } = await import("@/lib/billing/webhook");

const sub = (over: Record<string, unknown> = {}) =>
  ({ id: "sub_1", status: "active", cancel_at_period_end: false, cancel_at: null, customer: "cus_1", items: { data: [{ price: { id: "price_pro" }, current_period_end: 1_800_000_000 }] }, ...over }) as never;

describe("facturation", () => {
  it("associe les prix Stripe aux formules", () => {
    expect(planFromPrice("price_pro")).toBe("pro");
    expect(planFromPrice("price_starter")).toBe("starter");
    expect(planFromPrice("price_inconnu")).toBeNull();
    expect(planFromPrice(null)).toBeNull();
  });
  it("lit la fin de période au niveau de l'item (API récente)", () => {
    expect(subscriptionFields(sub())).toEqual({ plan: "pro", status: "active", periodEnd: new Date(1_800_000_000_000).toISOString(), cancelAtPeriodEnd: false });
  });
  it("lit la fin de période au niveau de l'abonnement (API ancienne)", () => {
    const s = sub({ items: { data: [{ price: { id: "price_starter" } }] }, current_period_end: 1_700_000_000 });
    expect(subscriptionFields(s).periodEnd).toBe(new Date(1_700_000_000_000).toISOString());
  });
  it("détecte une résiliation programmée", () => {
    expect(subscriptionFields(sub({ cancel_at_period_end: true })).cancelAtPeriodEnd).toBe(true);
    expect(subscriptionFields(sub({ cancel_at: 1_800_000_000 })).cancelAtPeriodEnd).toBe(true);
  });
});
