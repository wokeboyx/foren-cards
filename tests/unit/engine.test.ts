import { describe, expect, it } from "vitest";
import { authorize, type AuthContext } from "@/domain/authorize";
import { forecast } from "@/domain/forecast";
import {
  activeCardCount,
  expiryFrom,
  isExpiringSoon,
  validateLimits,
} from "@/domain/limits";
import { convert, money } from "@/domain/money";
import { cardFundingFee } from "@/domain/fees";
import { fundingCost, route } from "@/domain/routing";
import type { Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { seed } from "@/fixtures/seed";

const NOW = new Date("2026-10-12T12:00:00Z");
const S = seed(NOW);
const card = (id: string): Card =>
  structuredClone(S.cards.find((c) => c.id === id)!);
const m = (id: string) => merchantById(id)!;
const ctx = (over: Partial<AuthContext> = {}): AuthContext => ({
  balances: S.balances,
  transactions: S.transactions,
  requests: [],
  subscriptions: S.subscriptions,
  now: NOW,
  ...over,
});

describe("routing", () => {
  it("pays from the card balance with no FX when the charge is in the card's currency", () => {
    const r = route(money(100, "USD"), money(500, "USD"));
    expect(r.ok && r.legs).toHaveLength(1);
    expect(r.ok && r.legs[0].source).toEqual({ kind: "card", currency: "USD" });
    expect(r.ok && r.legs[0].fx).toBeUndefined();
  });
  it("converts, with a fee shown separately, when the charge is in another currency", () => {
    const r = route(money(100, "GBP"), money(500, "USD"));
    expect(r.ok && r.legs[0].fx?.fee.minor).toBeGreaterThan(0);
    expect(r.ok && r.legs[0].debit.currency).toBe("USD");
  });
  it("never splits across balances or dips into the account: a card that can't cover a charge declines it", () => {
    expect(route(money(600, "USD"), money(500, "USD")).ok).toBe(false);
    expect(route(money(1, "USD"), money(0, "USD")).ok).toBe(false);
  });
  it("funding a card in another currency costs a conversion fee", () => {
    const same = fundingCost(money(100, "USD"), "USD");
    expect(same.fx).toBe(false);
    // The card funding fee is 1% of the amount: $1.00 on $100.00
    expect(same.cardFee).toEqual(money(1, "USD"));
    expect(same.debit).toEqual(money(101, "USD"));
    const other = fundingCost(money(100, "USD"), "GBP");
    expect(other.fx).toBe(true);
    expect(other.fee.minor).toBeGreaterThan(0);
    expect(other.debit.currency).toBe("GBP");
  });
});

describe("card funding fee", () => {
  it("is 1% of the amount, capped at $100", () => {
    expect(cardFundingFee(money(500, "USD"))).toEqual(money(5, "USD"));
    expect(cardFundingFee(money(50_000, "USD"))).toEqual(money(100, "USD"));
    expect(cardFundingFee(money(1_000_000, "USD"))).toEqual(money(100, "USD"));
  });
  it("is capped in the card's currency too", () => {
    const fee = cardFundingFee(money(100_000_000, "NGN"));
    expect(fee.currency).toBe("NGN");
    expect(fee).toEqual({
      minor: convert(money(100, "USD"), "NGN").minor,
      currency: "NGN",
    });
  });
});

describe("authorize", () => {
  it("approves a normal charge with ordered passed steps", () => {
    const d = authorize(card("c_ops"), m("m_uber"), money(5000, "NGN"), ctx());
    expect(d.approved).toBe(true);
    expect(d.steps.map((s) => s.key)).toEqual([
      "status",
      "permissions",
      "limits",
      "balances",
    ]);
  });
  it.each([
    ["c_lagos", "m_jumia", money(10, "NGN"), "frozen"],
    ["c_events", "m_uber", money(10, "NGN"), "canceled"],
    ["c_ops", "m_bet9ja", money(10, "NGN"), "category_blocked"],
    ["c_mkt", "m_jumia", money(10, "NGN"), "merchant_not_allowed"],
    ["c_sw", "m_uber", money(10, "NGN"), "category_blocked"],
    ["c_ent", "m_ba", money(300, "GBP"), "per_charge_limit"],
    ["c_figma", "m_figma", money(210, "USD"), "per_charge_limit"],
    ["c_ops", "m_ba", money(30000, "USD"), "per_charge_limit"],
  ] as const)("%s at %s declines with %s", (cid, mid, amt, reason) => {
    const d = authorize(card(cid), m(mid), amt, ctx());
    expect(d.approved).toBe(false);
    if (!d.approved) expect(d.reason).toBe(reason);
  });
  it("declines with spend_limit when a charge fits the transaction limit but not what's left of the daily limit", () => {
    const c = {
      ...card("c_ops"),
      limit: { daily: money(1000, "USD"), txn: money(600, "USD") },
    };
    const earlier = {
      id: "t_today",
      cardId: c.id,
      merchantId: "m_uber",
      status: "approved",
      at: NOW.toISOString(),
      amount: money(500, "USD"),
    } as AuthContext["transactions"][number];
    const d = authorize(
      c,
      m("m_uber"),
      money(600, "USD"),
      ctx({ transactions: [earlier] }),
    );
    expect(!d.approved && d.reason).toBe("spend_limit");
    expect(
      authorize(
        c,
        m("m_uber"),
        money(400, "USD"),
        ctx({ transactions: [earlier] }),
      ).approved,
    ).toBe(true);
  });
  it("declines with insufficient_balance when the card has no balance, so it must be funded to spend", () => {
    const c = { ...card("c_ops"), balance: money(0, "USD") };
    const d = authorize(c, m("m_uber"), money(5000, "NGN"), ctx());
    expect(!d.approved && d.reason).toBe("insufficient_balance");
  });
  it("a live one-time approval lets exactly that charge through", () => {
    const req = {
      ...S.requests[0],
      state: "approved" as const,
      windowEndsAt: new Date(NOW.getTime() + 60_000).toISOString(),
    };
    expect(
      authorize(
        card("c_ent"),
        m("m_ba"),
        money(620, "GBP"),
        ctx({ requests: [req] }),
      ).approved,
    ).toBe(true);
    // More than approved -> still declined
    expect(
      authorize(
        card("c_ent"),
        m("m_ba"),
        money(700, "GBP"),
        ctx({ requests: [req] }),
      ).approved,
    ).toBe(false);
    // After the window -> declined
    expect(
      authorize(
        card("c_ent"),
        m("m_ba"),
        money(620, "GBP"),
        ctx({ requests: [req], now: new Date(NOW.getTime() + 120_000) }),
      ).approved,
    ).toBe(false);
  });
});

describe("forecast", () => {
  it("needs two charges before estimating", () => {
    expect(
      forecast(
        S.subscriptions.find((s) => s.id === "s_adobe")!,
        NOW,
      ).kind,
    ).toBe("insufficient_history");
    expect(
      forecast(
        S.subscriptions.find((s) => s.id === "s_notion")!,
        NOW,
      ).kind,
    ).toBe("estimate");
  });
});

describe("card controls (personal)", () => {
  const withControls = (controls: Card["controls"]) => ({
    ...card("c_ops"),
    controls,
  });
  it("declines a foreign-currency charge when other currencies are turned off", () => {
    const d = authorize(
      withControls({ online: true, foreignCurrency: false, non3ds: false }),
      m("m_figma"),
      money(10, "USD"),
      ctx(),
    );
    expect(d.approved).toBe(false);
    expect(!d.approved && d.reason).toBe("card_control");
  });
  it("still allows a naira charge when only other currencies are turned off", () => {
    const d = authorize(
      withControls({ online: true, foreignCurrency: false, non3ds: false }),
      m("m_uber"),
      money(10, "NGN"),
      ctx(),
    );
    expect(d.approved || d.reason !== "card_control").toBe(true);
  });
  it("declines every charge when online payments are turned off", () => {
    const d = authorize(
      withControls({ online: false, foreignCurrency: true, non3ds: false }),
      m("m_uber"),
      money(10, "NGN"),
      ctx(),
    );
    expect(!d.approved && d.reason).toBe("card_control");
  });
});

describe("spending period", () => {
  it("declines outside the dates and allows inside them", () => {
    const c = {
      ...card("c_ops"),
      activeFrom: "2026-10-20",
      activeUntil: "2026-10-25",
    };
    const before = authorize(c, m("m_uber"), money(10, "NGN"), ctx());
    expect(!before.approved && before.reason).toBe("outside_period");
    const inside = authorize(
      c,
      m("m_uber"),
      money(10, "NGN"),
      ctx({ now: new Date("2026-10-22T12:00:00Z") }),
    );
    expect(inside.approved).toBe(true);
    const after = authorize(
      c,
      m("m_uber"),
      money(10, "NGN"),
      ctx({ now: new Date("2026-10-26T12:00:00Z") }),
    );
    expect(!after.approved && after.reason).toBe("outside_period");
  });
});

describe("limits", () => {
  it("requires the transaction limit to be no more than the daily limit", () => {
    expect(validateLimits(money(1000, "USD"), money(500, "USD"))).toEqual({});
    expect(validateLimits(money(1000, "USD"), money(1000, "USD"))).toEqual({});
    expect(validateLimits(money(1000, "USD"), money(1001, "USD")).txn).toMatch(
      /can’t be more than the daily limit/,
    );
    expect(validateLimits(null, money(5, "USD")).daily).toBeDefined();
    expect(validateLimits(money(5, "USD"), money(0, "USD")).txn).toBeDefined();
  });
  it("expires cards 12 months after creation", () => {
    expect(expiryFrom(new Date("2026-10-27T10:00:00Z"))).toBe("2027-10");
  });
  it("labels active cards expiring within 30 days, until they expire", () => {
    const base = { status: "active", kind: "standard" } as const;
    // A card works through the end of its expiry month.
    expect(isExpiringSoon({ ...base, expiry: "2026-10" }, NOW)).toBe(true);
    expect(isExpiringSoon({ ...base, expiry: "2026-11" }, NOW)).toBe(false);
    expect(isExpiringSoon({ ...base, expiry: "2027-06" }, NOW)).toBe(false);
    expect(isExpiringSoon({ ...base, expiry: "2026-09" }, NOW)).toBe(false);
    expect(
      isExpiringSoon({ ...base, status: "canceled", expiry: "2026-10" }, NOW),
    ).toBe(false);
  });
  it("counts only active cards toward the cap", () => {
    expect(
      activeCardCount([
        { status: "active", archived: false },
        { status: "canceled", archived: false },
        { status: "frozen", archived: false },
      ]),
    ).toBe(2);
  });
});
