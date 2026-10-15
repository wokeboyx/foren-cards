import { describe, expect, it } from "vitest";
import { authorize, type AuthContext } from "@/domain/authorize";
import { checkMerchant } from "@/domain/compatibility";
import { forecast } from "@/domain/forecast";
import { money } from "@/domain/money";
import { route } from "@/domain/routing";
import type { Balance, Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { seed } from "@/fixtures/seed";

const NOW = new Date("2026-10-12T12:00:00Z");
const S = seed(NOW);
const card = (id: string): Card => structuredClone(S.cards.find((c) => c.id === id)!);
const m = (id: string) => merchantById(id)!;
const ctx = (over: Partial<AuthContext> = {}): AuthContext => ({
  balances: S.balances,
  transactions: S.transactions,
  requests: [],
  subscriptions: S.subscriptions,
  now: NOW,
  ...over,
});
const bals = (o: Partial<Record<string, number>>): Balance[] =>
  (["USD", "GBP", "EUR", "NGN", "CAD"] as const).map((c) => ({ currency: c, available: money(o[c] ?? 0, c) }));

describe("routing", () => {
  it("pays from the same-currency balance with no FX under cheapest_fx", () => {
    const r = route(money(100, "GBP"), card("c_ops").funding, bals({ GBP: 500, USD: 500 }));
    expect(r.ok && r.legs).toHaveLength(1);
    expect(r.ok && r.legs[0].fx).toBeUndefined();
    expect(r.ok && r.feeAvoided).toBeDefined();
  });
  it("splits across balances when one isn't enough", () => {
    const r = route(money(1000, "GBP"), card("c_ops").funding, bals({ GBP: 400, USD: 5000 }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.legs).toHaveLength(2);
      expect(r.legs.reduce((s, l) => s + l.covers.minor, 0)).toBe(100000);
      expect(r.legs[1].fx?.fee.minor).toBeGreaterThan(0);
      expect(r.feeAvoided).toBeUndefined();
    }
  });
  it("protect keeps the chosen currency for last", () => {
    const r = route(money(100, "EUR"), card("c_sw").funding, bals({ USD: 5000, GBP: 5000 }));
    expect(r.ok && r.legs[0].source).toEqual({ kind: "balance", currency: "GBP" });
  });
  it("protect works for any currency, e.g. a UK business protecting GBP", () => {
    const f = { strategy: "protect" as const, protect: "GBP" as const, order: card("c_sw").funding.order };
    const r = route(money(100, "EUR"), f, bals({ USD: 5000, GBP: 5000 }));
    expect(r.ok && r.legs[0].source).toEqual({ kind: "balance", currency: "USD" });
    // Charges in the protected currency still use it first, so there's no conversion
    const same = route(money(100, "GBP"), f, bals({ USD: 5000, GBP: 5000 }));
    expect(same.ok && same.legs[0].source).toEqual({ kind: "balance", currency: "GBP" });
  });
  it("only pays from balances: fails when they can't cover the charge", () => {
    expect(route(money(100, "USD"), card("c_ops").funding, bals({})).ok).toBe(false);
  });
});

describe("authorize", () => {
  it("approves a normal charge with ordered passed steps", () => {
    const d = authorize(card("c_ops"), m("m_uber"), money(5000, "NGN"), ctx());
    expect(d.approved).toBe(true);
    expect(d.steps.map((s) => s.key)).toEqual(["status", "permissions", "limits", "balances"]);
  });
  it.each([
    ["c_lagos", "m_jumia", money(10, "NGN"), "frozen"],
    ["c_events", "m_uber", money(10, "NGN"), "canceled"],
    ["c_ent", "m_netflix", money(10, "USD"), "merchant_blocked"],
    ["c_ops", "m_bet9ja", money(10, "NGN"), "category_blocked"],
    ["c_mkt", "m_jumia", money(10, "NGN"), "merchant_not_allowed"],
    ["c_sw", "m_uber", money(10, "NGN"), "category_blocked"],
    ["c_figma", "m_notion", money(10, "USD"), "merchant_not_allowed"],
    ["c_ent", "m_ba", money(300, "GBP"), "per_charge_limit"],
    ["c_figma", "m_figma", money(210, "USD"), "spend_limit"],
    ["c_ops", "m_ba", money(30000, "USD"), "spend_limit"],
  ] as const)("%s at %s declines with %s", (cid, mid, amt, reason) => {
    const d = authorize(card(cid), m(mid), amt, ctx());
    expect(d.approved).toBe(false);
    if (!d.approved) expect(d.reason).toBe(reason);
  });
  it("declines with insufficient_balance when nothing can cover it", () => {
    const c = card("c_ops");
    const d = authorize(c, m("m_uber"), money(5000, "NGN"), ctx({ balances: bals({}) }));
    expect(!d.approved && d.reason).toBe("insufficient_balance");
  });
  it("a live one-time approval lets exactly that charge through", () => {
    const req = { ...S.requests[0], state: "approved" as const, windowEndsAt: new Date(NOW.getTime() + 60_000).toISOString() };
    expect(authorize(card("c_ent"), m("m_ba"), money(620, "GBP"), ctx({ requests: [req] })).approved).toBe(true);
    // More than approved -> still declined
    expect(authorize(card("c_ent"), m("m_ba"), money(700, "GBP"), ctx({ requests: [req] })).approved).toBe(false);
    // After the window -> declined
    expect(authorize(card("c_ent"), m("m_ba"), money(620, "GBP"), ctx({ requests: [req], now: new Date(NOW.getTime() + 120_000) })).approved).toBe(false);
  });
});

describe("forecast", () => {
  it("needs two charges before estimating", () => {
    expect(forecast(S.subscriptions.find((s) => s.id === "s_adobe")!, NOW).kind).toBe("insufficient_history");
    expect(forecast(S.subscriptions.find((s) => s.id === "s_notion")!, NOW).kind).toBe("estimate");
  });
});

describe("merchant compatibility", () => {
  it("separates network evidence from card rules", () => {
    expect(checkMerchant(card("c_ops"), m("m_figma")).verdict).toBe("works");
    expect(checkMerchant(card("c_ops"), m("m_adobe")).verdict).toBe("setup_needed");
    expect(checkMerchant(card("c_ops"), m("m_kiosk")).verdict).toBe("no_history");
    const blocked = checkMerchant(card("c_ent"), m("m_netflix"));
    expect(blocked.verdict).toBe("wont_work");
    expect(blocked.network.verdict).toBe("works");
    expect(blocked.card.ok).toBe(false);
  });
});

describe("card controls (personal)", () => {
  const withControls = (controls: Card["controls"]) => ({ ...card("c_ops"), controls });
  it("declines a foreign-currency charge when other currencies are turned off", () => {
    const d = authorize(withControls({ online: true, foreignCurrency: false, non3ds: false }), m("m_figma"), money(10, "USD"), ctx());
    expect(d.approved).toBe(false);
    expect(!d.approved && d.reason).toBe("card_control");
  });
  it("still allows a naira charge when only other currencies are turned off", () => {
    const d = authorize(withControls({ online: true, foreignCurrency: false, non3ds: false }), m("m_uber"), money(10, "NGN"), ctx());
    expect(d.approved || d.reason !== "card_control").toBe(true);
  });
  it("declines every charge when online payments are turned off", () => {
    const d = authorize(withControls({ online: false, foreignCurrency: true, non3ds: false }), m("m_uber"), money(10, "NGN"), ctx());
    expect(!d.approved && d.reason).toBe("card_control");
  });
});

describe("spending period", () => {
  it("declines outside the dates and allows inside them", () => {
    const c = { ...card("c_ops"), activeFrom: "2026-10-20", activeUntil: "2026-10-25" };
    const before = authorize(c, m("m_uber"), money(10, "NGN"), ctx());
    expect(!before.approved && before.reason).toBe("outside_period");
    const inside = authorize(c, m("m_uber"), money(10, "NGN"), ctx({ now: new Date("2026-10-22T12:00:00Z") }));
    expect(inside.approved).toBe(true);
    const after = authorize(c, m("m_uber"), money(10, "NGN"), ctx({ now: new Date("2026-10-26T12:00:00Z") }));
    expect(!after.approved && after.reason).toBe("outside_period");
  });
});
