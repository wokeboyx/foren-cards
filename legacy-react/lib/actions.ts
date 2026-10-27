"use client";
// User-facing actions. Each goes through the mock API (latency + injectable failure), then
// updates the store. On failure nothing changes, so the UI can say previous settings are unchanged.
import { POLICY } from "@/config/policy";
import { authorize } from "@/domain/authorize";
import { format } from "@/domain/money";
import type { Card, CardDraft, CardRequest, DeclineReason, Merchant, Money, Transaction } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { DEFAULT_BLOCKED_CATEGORIES } from "@/domain/labels";
import { COMPANY, defaultFunding } from "@/fixtures/seed";

const COMPANY_NAME = COMPANY.name;
import { call } from "./api";
import { approvalWindowEnd, currentUserId, now, personById, uid, useStore } from "./store";

const S = () => useStore.getState();
const cardById = (id: string) => S().cards.find((c) => c.id === id)!;

export const randomLast4 = () => String(Math.floor(1000 + Math.random() * 9000));

/** Who is acting right now, for the card history. */
function actor() {
  return personById(currentUserId(S().role))?.name ?? "System";
}

/** Appends an entry to a card's history (newest first). */
function log(id: string, text: string, by = actor()) {
  const c = cardById(id);
  if (c) S().patchCard(id, { history: [{ at: now().toISOString(), text, by }, ...(c.history ?? [])] });
}

const STATE_NAME = { active: "Active", frozen: "Frozen", canceled: "Canceled" } as const;
const limitText = (l: Card["limit"]) => (l.amount.minor >= 1_000_000_000 ? "no limit" : `${format(l.amount)} ${l.period === "per_txn" ? "per charge" : l.period}`);

export async function freezeCard(id: string) {
  await call(() => {
    S().patchCard(id, { status: "frozen" });
    log(id, `Status changed from “Active” to “Frozen”`);
  });
}

export async function unfreezeCard(id: string) {
  await call(() => {
    const from = STATE_NAME[cardById(id).status];
    S().patchCard(id, { status: "active" });
    log(id, `Status changed from “${from}” to “Active”`);
  });
}

export async function cancelCard(id: string) {
  await call(() => {
    S().patchCard(id, { status: "canceled" });
    log(id, "Card canceled permanently");
    // Pending requests on a canceled card can no longer be acted on.
    for (const r of S().requests.filter((r) => r.cardId === id && r.state === "pending")) S().patchRequest(r.id, { state: "denied", denyNote: "Card was canceled." });
  });
}

export async function archiveCard(id: string) {
  await call(() => {
    S().patchCard(id, { archived: true });
    log(id, "Moved to Archived");
  });
}

export async function renameCard(id: string, nickname: string) {
  await call(() => {
    const from = cardById(id).nickname;
    S().patchCard(id, { nickname });
    log(id, `Nickname changed from “${from}” to “${nickname}”`);
  });
}

/** Changes the limit; a temporary change restores the previous limit at `until`. */
export async function setCardLimit(id: string, limit: Card["limit"], until?: string) {
  await call(() => {
    const c = cardById(id);
    S().patchCard(id, { limit, limitRestore: until ? { limit: c.limitRestore?.limit ?? c.limit, at: until } : undefined });
    log(id, `Spending limit changed from ${limitText(c.limit)} to ${limitText(limit)}${until ? `, until ${new Date(until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}`);
  });
}

/** Restores any temporary limits whose period has ended. Called on the prototype clock tick. */
export function restoreExpiredLimits(at: Date) {
  for (const c of S().cards)
    if (c.limitRestore && new Date(c.limitRestore.at) <= at) {
      S().patchCard(c.id, { limit: c.limitRestore.limit, limitRestore: undefined });
      log(c.id, `Temporary limit ended. Back to ${limitText(c.limitRestore.limit)}`, "System");
    }
}

export async function saveCard(card: Card) {
  await call(() => {
    const before = S().cards.find((c) => c.id === card.id);
    S().upsertCard({ ...card, history: before?.history });
    if (before) log(card.id, "Card settings updated");
  });
}

export async function issueCard(card: Card) {
  return call(() => {
    S().upsertCard({ ...card, history: [{ at: now().toISOString(), text: "Card created", by: actor() }] });
    return card;
  });
}

export function newCardDraft(holderId: string): Card {
  const n = now();
  const exp = new Date(n);
  exp.setFullYear(exp.getFullYear() + 3);
  return {
    id: uid("c"),
    nickname: "",
    holderId,
    kind: "standard",
    status: "active",
    archived: false,
    design: "midnight",
    last4: randomLast4(),
    expiry: `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, "0")}`,
    funding: defaultFunding(),
    permissions: {
      mode: "anywhere",
      allowedMerchantIds: [],
      allowedCategories: [],
      blockedMerchantIds: [],
      blockedCategories: [...DEFAULT_BLOCKED_CATEGORIES],
    },
    limit: { period: "monthly", amount: { minor: 500_000, currency: "USD" } },
    billingAddress: { line1: "14 Adeola Odeku Street", city: "Lagos", postcode: "101241", country: "Nigeria" },
    createdAt: n.toISOString(),
  };
}

/**
 * Gives a merchant its own card, copied from the shared card it's been charging.
 * The merchant keeps charging the old card until the customer updates their card with the merchant
 * (that happens off-app). When the merchant first charges the new card, Foren can block the merchant
 * on the old card automatically (`blockOld`).
 */
export async function giveMerchantOwnCard(sourceCardId: string, merchantId: string, blockOld: boolean) {
  return call(() => {
    const from = cardById(sourceCardId);
    const m = merchantById(merchantId)!;
    const c: Card = {
      ...newCardDraft(from.holderId),
      nickname: m.name,
      lockedMerchantId: m.id,
      design: from.design,
      funding: { ...from.funding },
      limit: from.limit,
      moveFrom: { cardId: from.id, merchantId: m.id, blockOld },
      history: [{ at: now().toISOString(), text: `Card created for ${m.name}, moving it off ${from.nickname} •• ${from.last4}`, by: actor() }],
    };
    S().upsertCard(c);
    log(from.id, `${m.name} is moving to its own card •• ${c.last4}`);
    for (const sub of S().subscriptions.filter((x) => x.cardId === from.id && x.merchantId === m.id)) S().patchSubscription(sub.id, { movingToCardId: c.id });
    return c;
  });
}

// ---------------------------------------------------------------- requests

function notifyOwner(title: string, body: string, href = "/requests") {
  S().notify({ forRole: "owner", title, body, href });
}
function notifyCardholder(title: string, body: string, href: string) {
  S().notify({ forRole: "cardholder", title, body, href });
}

export async function requestUnfreeze(cardId: string, note?: string, attemptTxId?: string) {
  return call(() => {
    const role = S().role;
    const r: CardRequest = { id: uid("r"), kind: "unfreeze", requesterId: currentUserId(role), cardId, note, attemptTxId, state: "pending", createdAt: now().toISOString() };
    S().addRequest(r);
    const c = cardById(cardId);
    notifyOwner("Unfreeze requested", `${personById(r.requesterId)?.name} asked you to unfreeze ${c.nickname} •• ${c.last4}.`);
    return r;
  });
}

/** A team member asks the owner for a new card (shown as a pending row in their card list). */
export async function requestNewCard(input: { nickname: string; limit: Card["limit"]; oneMerchant: boolean; design: Card["design"]; note?: string }) {
  return call(() => {
    const { note, ...newCard } = input;
    const r: CardRequest = { id: uid("r"), kind: "new_card", requesterId: currentUserId(S().role), newCard, note, state: "pending", createdAt: now().toISOString() };
    S().addRequest(r);
    notifyOwner("New card requested", `${personById(r.requesterId)?.name} asked for a card: “${input.nickname}”, up to ${limitText(input.limit)}.`);
    return r;
  });
}

/** Cardholder asks for a higher (or different) limit on one of their cards. */
export async function requestLimitIncrease(cardId: string, newLimit: Card["limit"], note?: string) {
  return call(() => {
    const c = cardById(cardId);
    const r: CardRequest = { id: uid("r"), kind: "limit_increase", requesterId: currentUserId(S().role), cardId, newLimit, oldLimit: c.limit, note, state: "pending", createdAt: now().toISOString() };
    S().addRequest(r);
    notifyOwner("Limit increase requested", `${personById(r.requesterId)?.name} asked to raise ${c.nickname} to ${limitText(newLimit)}.`);
    return r;
  });
}

export async function requestApproval(input: { cardId: string; merchantId: string; amount: Money; reason: DeclineReason; note?: string; attemptTxId?: string }) {
  return call(() => {
    const r: CardRequest = {
      id: uid("r"),
      kind: "one_time_approval",
      requesterId: currentUserId(S().role),
      ...input,
      state: "pending",
      createdAt: now().toISOString(),
    };
    S().addRequest(r);
    const c = cardById(input.cardId);
    notifyOwner(
      "Approval requested",
      `${personById(r.requesterId)?.name} asked to approve ${format(input.amount)} at ${merchantById(input.merchantId)?.name} on ${c.nickname}.`
    );
    return r;
  });
}

export async function requestEmergencyCard(input: { merchantId: string; amount: Money; note: string; cardId?: string; attemptTxId?: string }) {
  return call(() => {
    const r: CardRequest = {
      id: uid("r"),
      kind: "emergency_card",
      requesterId: currentUserId(S().role),
      merchantId: input.merchantId,
      amount: input.amount,
      cardId: input.cardId,
      note: input.note,
      attemptTxId: input.attemptTxId,
      state: "pending",
      createdAt: now().toISOString(),
    };
    S().addRequest(r);
    notifyOwner(
      "Emergency card requested",
      `${personById(r.requesterId)?.name} needs a single-use card for ${format(input.amount)} at ${merchantById(input.merchantId)?.name}.`
    );
    return r;
  });
}

export async function decideRequest(id: string, approve: boolean, denyNote?: string) {
  return call(() => {
    const r = S().requests.find((x) => x.id === id)!;
    const at = now();
    if (!approve) {
      S().patchRequest(id, { state: "denied", decidedAt: at.toISOString(), denyNote, decidedBy: actor() });
      notifyCardholder("Request declined", `${requestTitle(r)} was declined.${denyNote ? ` “${denyNote}”` : ""}`, payHref(r));
      return;
    }
    if (r.kind === "one_time_approval") {
      S().patchRequest(id, { state: "approved", decidedAt: at.toISOString(), windowEndsAt: approvalWindowEnd(at), decidedBy: actor() });
      notifyCardholder("Approved for one charge", `Retry ${format(r.amount!)} at ${merchantById(r.merchantId!)?.name} within ${POLICY.approvalWindowMinutes} minutes.`, payHref(r));
    } else if (r.kind === "unfreeze") {
      S().patchCard(r.cardId!, { status: "active" });
      log(r.cardId!, `Status changed from “Frozen” to “Active” (approved request from ${personById(r.requesterId)?.name})`);
      S().patchRequest(id, { state: "approved", decidedAt: at.toISOString(), decidedBy: actor() });
      const c = cardById(r.cardId!);
      notifyCardholder("Card unfrozen", `${c.nickname} •• ${c.last4} is active again.`, `/cards/${c.id}`);
    } else if (r.kind === "limit_increase") {
      const c = cardById(r.cardId!);
      S().patchCard(c.id, { limit: r.newLimit!, limitRestore: undefined });
      log(c.id, `Spending limit changed from ${limitText(c.limit)} to ${limitText(r.newLimit!)} (approved request from ${personById(r.requesterId)?.name})`);
      S().patchRequest(id, { state: "approved", decidedAt: at.toISOString(), decidedBy: actor() });
      notifyCardholder("Limit increase approved", `${c.nickname} can now spend up to ${limitText(r.newLimit!)}.`, `/cards/${c.id}`);
    } else if (r.kind === "new_card") {
      const want = r.newCard!;
      const card: Card = {
        ...newCardDraft(r.requesterId),
        nickname: want.nickname,
        design: want.design,
        limit: want.limit,
        permissions: { ...newCardDraft(r.requesterId).permissions, mode: want.oneMerchant ? "first_merchant" : "anywhere" },
        history: [{ at: at.toISOString(), text: `Card created from ${personById(r.requesterId)?.name}’s request`, by: actor() }],
      };
      S().upsertCard(card);
      S().patchRequest(id, { state: "approved", decidedAt: at.toISOString(), issuedCardId: card.id, decidedBy: actor() });
      notifyCardholder("Your card is ready", `${want.nickname} •• ${card.last4} was approved. You can use it now.`, `/cards/${card.id}`);
    } else {
      const m = merchantById(r.merchantId!)!;
      const card: Card = {
        ...newCardDraft(r.requesterId),
        nickname: `Emergency · ${m.name}`,
        kind: "emergency",
        design: "cream",
        lockedMerchantId: m.id,
        singleUse: true,
        validUntil: new Date(at.getTime() + POLICY.emergencyValidityMinutes * 60_000).toISOString(),
        limit: { period: "per_txn", amount: r.amount! },
        funding: defaultFunding(),
        history: [{ at: at.toISOString(), text: `Emergency card issued for ${m.name} (approved request from ${personById(r.requesterId)?.name})`, by: actor() }],
      };
      S().upsertCard(card);
      S().patchRequest(id, { state: "approved", decidedAt: at.toISOString(), issuedCardId: card.id, decidedBy: actor() });
      notifyCardholder("Emergency card ready", `Single-use card for ${m.name} is valid for ${POLICY.emergencyValidityMinutes} minutes.`, `/cards/${card.id}`);
    }
  });
}

function requestTitle(r: CardRequest) {
  if (r.kind === "unfreeze") return "Your unfreeze request";
  if (r.kind === "new_card") return `Your request for “${r.newCard?.nickname}”`;
  if (r.kind === "limit_increase") return `Your limit request for ${cardById(r.cardId!)?.nickname}`;
  if (r.kind === "emergency_card") return "Your emergency card request";
  return `Your request for ${format(r.amount!)} at ${merchantById(r.merchantId!)?.name}`;
}
const payHref = (r: CardRequest) => (r.kind === "unfreeze" ? `/cards/${r.cardId}` : r.kind === "new_card" ? `/cards?request=${r.id}` : "/requests");

// ---------------------------------------------------------------- payments (simulated)

/**
 * Simulates the cardholder attempting a payment. Records an approved or declined transaction
 * so the decline-recovery surface has something real to explain. Clearly labelled as simulated in the UI.
 */
export async function attemptPayment(cardId: string, merchantId: string, amount: Money) {
  return call(() => {
    const s = S();
    const card = cardById(cardId);
    const merchant = merchantById(merchantId)!;
    const at = now();
    const d = authorize(card, merchant, amount, {
      balances: card.personal ? s.personalBalances : s.balances,
      transactions: s.transactions,
      requests: s.requests,
      subscriptions: s.subscriptions,
      now: at,
    });
    const t: Transaction = d.approved
      ? { id: uid("t"), cardId, merchantId, amount, status: "approved", at: at.toISOString(), legs: d.legs, feeAvoided: d.feeAvoided, viaApprovalId: d.viaApprovalId }
      : { id: uid("t"), cardId, merchantId, amount, status: "declined", at: at.toISOString(), legs: [], declineReason: d.reason };
    s.recordTransaction(t);
    if (d.approved) {
      if (d.viaApprovalId) s.patchRequest(d.viaApprovalId, { state: "used" });
      if (card.singleUse) s.patchCard(card.id, { used: true });
      // allow-next-attempt is one-shot
      const sub = s.subscriptions.find((x) => x.cardId === cardId && x.merchantId === merchantId && x.allowNextAttempt);
      if (sub) s.patchSubscription(sub.id, { allowNextAttempt: false });
      afterApprovedCharge(card, merchant);
    }
    return { transaction: t, decision: d };
  });
}

/** What happens after a charge goes through, based on which merchant charged which card. */
function afterApprovedCharge(card: Card, merchant: Merchant) {
  // 1. "One merchant" cards lock to whoever charges them first.
  if (card.permissions.mode === "first_merchant" && !card.lockedMerchantId) {
    // A one-shop card still on its default name takes the merchant's name.
    S().patchCard(card.id, { lockedMerchantId: merchant.id, nickname: card.nickname === "One-shop card" ? merchant.name : card.nickname });
    log(card.id, `Locked to ${merchant.name}, the first merchant to charge it`, "System");
    S().notify({
      forRole: card.personal ? "individual" : "owner",
      title: `${card.nickname} is now locked to ${merchant.name}`,
      body: `Only ${merchant.name} can charge it from now on.`,
      href: card.personal ? `/personal?card=${card.id}` : `/cards/${card.id}`,
    });
    return;
  }
  // 2. A merchant's own card has been charged: the merchant has switched over.
  if (card.moveFrom && card.moveFrom.merchantId === merchant.id) {
    const from = cardById(card.moveFrom.cardId);
    if (card.moveFrom.blockOld && from && from.status !== "canceled" && !from.permissions.blockedMerchantIds.includes(merchant.id)) {
      S().patchCard(from.id, { permissions: { ...from.permissions, blockedMerchantIds: [...from.permissions.blockedMerchantIds, merchant.id] } });
      log(from.id, `${merchant.name} blocked: it now charges its own card •• ${card.last4}`, "System");
    }
    S().patchCard(card.id, { moveFrom: undefined });
    log(card.id, `${merchant.name} switched to this card`, "System");
    for (const sub of S().subscriptions.filter((x) => x.movingToCardId === card.id)) S().patchSubscription(sub.id, { cardId: card.id, movingToCardId: undefined, lastDecline: undefined });
    S().notify({
      forRole: "owner",
      title: `${merchant.name} moved to its own card`,
      body: card.moveFrom.blockOld ? `It charged •• ${card.last4} for the first time, so we blocked ${merchant.name} on ${from?.nickname}.` : `It charged •• ${card.last4} for the first time.`,
      href: `/cards/${card.id}`,
    });
    return;
  }
}

// ---------------------------------------------------------------- merchant blocking

/** Blocks future charges from a merchant on one card. Does not cancel any subscription contract. */
export async function blockMerchant(cardId: string, merchantId: string) {
  await call(() => {
    const c = cardById(cardId);
    if (!c.permissions.blockedMerchantIds.includes(merchantId))
    {
      S().patchCard(cardId, { permissions: { ...c.permissions, blockedMerchantIds: [...c.permissions.blockedMerchantIds, merchantId] } });
      log(cardId, `${merchantById(merchantId)?.name} blocked`);
    }
    for (const s of S().subscriptions.filter((x) => x.cardId === cardId && x.merchantId === merchantId)) S().patchSubscription(s.id, { blocked: true, allowNextAttempt: false });
  });
}

export async function unblockMerchant(cardId: string, merchantId: string) {
  await call(() => {
    const c = cardById(cardId);
    S().patchCard(cardId, { permissions: { ...c.permissions, blockedMerchantIds: c.permissions.blockedMerchantIds.filter((x) => x !== merchantId) } });
    log(cardId, `${merchantById(merchantId)?.name} unblocked`);
    for (const s of S().subscriptions.filter((x) => x.cardId === cardId && x.merchantId === merchantId)) S().patchSubscription(s.id, { blocked: false, allowNextAttempt: false });
  });
}

/** Keeps the block but lets the next attempt from this merchant through once. */
export async function allowNextAttempt(subscriptionId: string) {
  await call(() => S().patchSubscription(subscriptionId, { allowNextAttempt: true }));
}

// ---------------------------------------------------------------- subscriptions

export async function setReminders(subId: string, reminders: { owner: boolean; cardholder: boolean; daysBefore: number }) {
  await call(() => S().patchSubscription(subId, { reminders }));
}

/** Creates a card locked to the subscription merchant. The merchant keeps charging the old card until billing is updated. */
/** Prototype stand-in for the merchant confirming new billing details. */
export async function confirmBillingMoved(subId: string) {
  await call(() => {
    const s = S().subscriptions.find((x) => x.id === subId)!;
    if (s.movingToCardId) S().patchSubscription(subId, { cardId: s.movingToCardId, movingToCardId: undefined, lastDecline: undefined });
  });
}

export async function topUpBalance(currency: Money["currency"], minor: number) {
  await call(() => S().adjustBalance(currency, minor));
}

// ---------------------------------------------------------------- personal (proposed)

/** Replace = cancel this card and issue a new number with the same settings. */
export async function replaceCard(id: string) {
  return call(() => {
    const old = cardById(id);
    S().patchCard(id, { status: "canceled" });
    const c: Card = { ...old, id: uid("c"), last4: randomLast4(), status: "active", createdAt: now().toISOString(), history: [{ at: now().toISOString(), text: `Card created to replace •• ${old.last4}`, by: actor() }] };
    log(id, `Replaced by a new card •• ${c.last4}. This card no longer works.`);
    S().upsertCard(c);
    for (const sub of S().subscriptions.filter((x) => x.cardId === id)) S().patchSubscription(sub.id, { movingToCardId: c.id });
    return c;
  });
}

/** Change how a card looks or works (nickname, design, card controls, limit). */
/** Cards without saved controls allow everything. */
export const DEFAULT_CONTROLS = { online: true, foreignCurrency: true, non3ds: true } as const;

export async function updateCard(id: string, patch: Partial<Pick<Card, "nickname" | "design" | "controls" | "limit">>) {
  await call(() => {
    const before = cardById(id);
    S().patchCard(id, patch);
    if (patch.nickname !== undefined && patch.nickname !== before.nickname) log(id, `Label changed from “${before.nickname}” to “${patch.nickname}”`);
    if (patch.design && patch.design !== before.design) log(id, `Card colour changed to ${patch.design[0].toUpperCase() + patch.design.slice(1)}`);
    if (patch.controls) {
      const was = before.controls ?? DEFAULT_CONTROLS;
      const names = { online: "Online payments", foreignCurrency: "Payments in other currencies", non3ds: "Payments without a security code" } as const;
      for (const k of Object.keys(names) as (keyof typeof names)[])
        if (patch.controls[k] !== was[k]) log(id, `${names[k]} turned ${patch.controls[k] ? "on" : "off"}`);
    }
  });
}

/** Demo helper: records a personal purchase, optionally marking it as recurring. */
export async function simulatePersonalPurchase(cardId: string, merchantId: string, amount: Money, recurring: boolean) {
  const r = await attemptPayment(cardId, merchantId, amount);
  if (recurring && r.transaction.status === "approved") {
    const existing = S().subscriptions.find((x) => x.cardId === cardId && x.merchantId === merchantId);
    if (existing) S().patchSubscription(existing.id, { chargeDates: [...existing.chargeDates, r.transaction.at] });
    if (!existing)
      useStore.setState((st) => ({
        subscriptions: [
          ...st.subscriptions,
          { id: uid("s"), merchantId, cardId, usualAmount: amount, frequency: "monthly", chargeDates: [r.transaction.at], blocked: false, reminders: { owner: false, cardholder: true, daysBefore: 3 } },
        ],
      }));
  }
  return r;
}

// ---------------------------------------------------------------- demo helpers (Demo panel only)

/** Demo: merchants with their own new card switch over and charge it for the first time. */
export async function demoMerchantsSwitch() {
  const moving = S().cards.filter((c) => c.moveFrom && c.status === "active");
  if (!moving.length) throw new Error("No merchants are waiting to switch");
  for (const c of moving) {
    const m = merchantById(c.moveFrom!.merchantId)!;
    await attemptPayment(c.id, m.id, m.billingCurrency === "NGN" ? { minor: 1_250_000, currency: "NGN" } : { minor: 1599, currency: m.billingCurrency });
  }
  return moving.length;
}

/** Adds someone who isn't on Foren yet, so a card can be created for them. They get an email invite. */
export async function invitePerson(name: string, email: string) {
  return call(() => {
    const p = { id: uid("u"), name, email, role: "cardholder" as const, invited: true };
    S().invitePerson(p);
    S().notify({ forRole: "owner", title: `Invite sent to ${name}`, body: `${email} will get an email to join ${COMPANY_NAME} on Foren.`, href: "/cards" });
    return p;
  });
}

// ---------------------------------------------------------------- expenses, wallets, lock, periods, drafts, bulk

/** Note, category or receipt on a transaction (expense details). */
export async function updateTransaction(id: string, patch: Partial<Pick<Transaction, "note" | "expenseCategory" | "receipt">>) {
  await call(() => S().patchTransaction(id, patch));
}

/** Simulated: adds the card to Apple Pay or Google Pay. Real provisioning depends on the card processor. */
export async function addToWallet(cardId: string, wallet: "apple" | "google") {
  await call(() => {
    const c = cardById(cardId);
    S().patchCard(cardId, { wallets: [...new Set([...(c.wallets ?? []), wallet])] });
    log(cardId, `Added to ${wallet === "apple" ? "Apple Pay" : "Google Pay"}`);
  });
}

/** Admin lock: stops the card like a freeze, but only an account admin can unlock it (no unfreeze requests). */
export async function lockCard(id: string, reason?: string) {
  await call(() => {
    const from = STATE_NAME[cardById(id).status];
    S().patchCard(id, { status: "frozen", adminLock: { by: actor(), at: now().toISOString(), reason } });
    log(id, `Locked by an admin (was “${from}”)${reason ? `: ${reason}` : ""}`);
    for (const r of S().requests.filter((r) => r.cardId === id && r.kind === "unfreeze" && r.state === "pending")) S().patchRequest(r.id, { state: "denied", denyNote: "The card was locked by an admin." });
  });
}

export async function unlockCard(id: string) {
  await call(() => {
    S().patchCard(id, { status: "active", adminLock: undefined });
    log(id, "Unlocked by an admin");
  });
}

/** Spending period: the card only works between these dates. Clear both to remove it. */
export async function setSpendingPeriod(id: string, activeFrom?: string, activeUntil?: string) {
  await call(() => {
    S().patchCard(id, { activeFrom, activeUntil });
    log(id, activeFrom || activeUntil ? `Spending period set: ${activeFrom ?? "now"} to ${activeUntil ?? "no end"}` : "Spending period removed");
  });
}

/** Bulk create (Revolut "Name company cards"): one card per name, same settings. */
export async function issueCards(cards: Card[]) {
  return call(() => {
    for (const card of cards) S().upsertCard({ ...card, history: [{ at: now().toISOString(), text: cards.length > 1 ? `Card created (one of ${cards.length} created together)` : "Card created", by: actor() }] });
    return cards;
  });
}

export async function saveCardDraft(d: CardDraft) {
  await call(() => S().saveCardDraft(d));
}

export function deleteCardDraft(id: string) {
  S().deleteCardDraft(id);
}
