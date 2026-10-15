// Merchant compatibility = network/merchant evidence + this card's own rules, reported separately.
import { CATEGORY_LABEL, STATUS_LABEL } from "./labels";
import type { Card, DeclineReason, Merchant } from "./types";

export type Verdict = "works" | "likely" | "setup_needed" | "wont_work" | "no_history";

export type CardRuleCheck =
  | { ok: true; detail: string }
  | { ok: false; reason: DeclineReason; rule: string; detail: string; fix: "unfreeze" | "allow_merchant" | "allow_category" | null };

export type CompatResult = {
  verdict: Verdict;
  network: { verdict: Verdict; detail: string; steps?: string[] };
  card: CardRuleCheck;
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  works: "Works",
  likely: "Likely to work",
  setup_needed: "Setup needed",
  wont_work: "Won’t work",
  no_history: "No history yet",
};

export function checkCardRules(card: Card, merchant: Merchant): CardRuleCheck {
  if (card.status !== "active")
    return {
      ok: false,
      reason: card.status === "frozen" ? "frozen" : "canceled",
      rule: `Card status: ${STATUS_LABEL[card.status]}`,
      detail: card.status === "frozen" ? "This card is frozen, so new charges will fail." : "This card has been canceled and can’t be used.",
      fix: card.status === "frozen" ? "unfreeze" : null,
    };
  const p = card.permissions;
  if (card.lockedMerchantId && card.lockedMerchantId !== merchant.id)
    return { ok: false, reason: "merchant_not_allowed", rule: "Locked to one merchant", detail: "This card only works at the merchant it’s locked to.", fix: null };
  if (p.blockedMerchantIds.includes(merchant.id))
    return { ok: false, reason: "merchant_blocked", rule: "Blocked merchant", detail: `${merchant.name} is blocked on this card.`, fix: "allow_merchant" };
  if (p.blockedCategories.includes(merchant.category))
    return { ok: false, reason: "category_blocked", rule: `Blocked category: ${CATEGORY_LABEL[merchant.category]}`, detail: `${CATEGORY_LABEL[merchant.category]} payments are blocked on this card.`, fix: "allow_category" };
  if (p.mode === "merchants" && !p.allowedMerchantIds.includes(merchant.id))
    return { ok: false, reason: "merchant_not_allowed", rule: "Selected merchants only", detail: `${merchant.name} isn’t on this card’s approved merchant list.`, fix: "allow_merchant" };
  if (p.mode === "categories" && !p.allowedCategories.includes(merchant.category))
    return { ok: false, reason: "category_blocked", rule: "Allowed categories only", detail: `${CATEGORY_LABEL[merchant.category]} isn’t an allowed category on this card.`, fix: "allow_category" };
  return { ok: true, detail: "This card’s rules allow this merchant." };
}

export function checkMerchant(card: Card, merchant: Merchant): CompatResult {
  const n = merchant.network;
  const network: CompatResult["network"] =
    n.kind === "works"
      ? { verdict: "works", detail: "Cards like this one have been accepted here." }
      : n.kind === "likely"
        ? { verdict: "likely", detail: n.note }
        : n.kind === "setup_needed"
          ? { verdict: "setup_needed", detail: "This merchant needs a little setup before it accepts the card.", steps: n.steps }
          : n.kind === "wont_work"
            ? { verdict: "wont_work", detail: n.reason }
            : { verdict: "no_history", detail: "We haven’t seen payments to this merchant yet, so we can’t say whether it will work." };
  const rules = checkCardRules(card, merchant);
  const verdict: Verdict = !rules.ok ? "wont_work" : network.verdict;
  return { verdict, network, card: rules };
}
