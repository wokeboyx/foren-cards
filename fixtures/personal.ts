// Personal-card discovery track (Flows 9–10). Proposed scope — not a PRD commitment.
// Starts empty so the first-card empty state is visible; the demo panel can load sample activity.
import type { Balance, Card, Subscription, Transaction } from "@/domain/types";
import { DEFAULT_BLOCKED_CATEGORIES } from "@/domain/labels";
import { money } from "@/domain/money";
import { route } from "@/domain/routing";

export const PERSONAL_HOLDER = "p_ife";

export const personalBalances = (): Balance[] => [
  { currency: "NGN", available: money(842_500, "NGN") },
  { currency: "USD", available: money(310.4, "USD") },
  { currency: "GBP", available: money(95, "GBP") },
];

export function personalSeed(): { balances: Balance[]; cards: Card[]; transactions: Transaction[]; subscriptions: Subscription[] } {
  return { balances: personalBalances(), cards: [], transactions: [], subscriptions: [] };
}

export function personalCard(partial: Partial<Card> & Pick<Card, "id" | "nickname" | "last4">): Card {
  return {
    holderId: PERSONAL_HOLDER,
    controls: { online: true, foreignCurrency: true, non3ds: false },
    kind: "standard",
    status: "active",
    archived: false,
    design: "aurora",
    expiry: "2029-10",
    funding: { strategy: "cheapest_fx", order: ["NGN", "USD", "GBP"] },
    permissions: { mode: "anywhere", allowedMerchantIds: [], allowedCategories: [], blockedMerchantIds: [], blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES] },
    limit: { period: "monthly", amount: money(200_000, "NGN") },
    billingAddress: { line1: "3 Admiralty Way", city: "Lagos", postcode: "106104", country: "Nigeria" },
    createdAt: new Date().toISOString(),
    personal: true,
    purpose: "General online spending",
    ...partial,
  };
}

/** Sample activity: one card with a recurring Spotify charge and a few purchases. */
export function samplePersonal(now = new Date()) {
  const ago = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
  const card = personalCard({ id: "pc_online", nickname: "Online shopping", last4: "7302" });
  const bals = personalBalances().map((b) => ({ ...b, available: { ...b.available, minor: b.available.minor * 10 } }));
  const mk = (id: string, merchantId: string, amount: ReturnType<typeof money>, d: number): Transaction => {
    const r = route(amount, card.funding, bals);
    return { id, cardId: card.id, merchantId, amount, status: "approved", at: ago(d), legs: r.ok ? r.legs : [], feeAvoided: r.ok ? r.feeAvoided : undefined };
  };
  const transactions = [
    mk("pt_1", "m_jumia", money(23_400, "NGN"), 1),
    mk("pt_2", "m_spotify", money(11.99, "GBP"), 12),
    mk("pt_3", "m_netflix", money(15.49, "USD"), 20),
    mk("pt_4", "m_spotify", money(11.99, "GBP"), 42),
  ];
  const subscriptions: Subscription[] = [
    { id: "ps_spotify", merchantId: "m_spotify", cardId: card.id, usualAmount: money(11.99, "GBP"), frequency: "monthly", chargeDates: [ago(42), ago(12)], blocked: false, reminders: { owner: false, cardholder: true, daysBefore: 3 } },
    { id: "ps_netflix", merchantId: "m_netflix", cardId: card.id, usualAmount: money(15.49, "USD"), frequency: "monthly", chargeDates: [ago(20)], blocked: false, reminders: { owner: false, cardholder: true, daysBefore: 3 } },
  ];
  return { card, transactions, subscriptions };
}
