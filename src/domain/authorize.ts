// The single authorisation engine. Test charge, decline recovery, merchant checks and
// subscription-risk warnings all call this, so a card behaves the same everywhere.
import { convert, format } from "./money";
import { route, type BalanceAttempt } from "./routing";
import { CATEGORY_LABEL } from "./labels";
import type {
  Balance,
  
  Card,
  CardRequest,
  DeclineReason,
  FeeAvoided,
  FundingLeg,
  LimitPeriod,
  Merchant,
  Money,
  Subscription,
  Transaction,
} from "./types";

export type StepKey = "status" | "permissions" | "limits" | "balances";

export type Step = {
  key: StepKey;
  label: string;
  result: "passed" | "blocked" | "skipped";
  detail: string;
  attempts?: BalanceAttempt[];
};

export type Decision =
  | { approved: true; steps: Step[]; legs: FundingLeg[]; feeAvoided?: FeeAvoided; viaApprovalId?: string }
  | { approved: false; steps: Step[]; reason: DeclineReason };

export type AuthContext = {
  balances: Balance[];
  transactions: Transaction[];
  requests: CardRequest[];
  subscriptions?: Subscription[];
  now: Date;
};

const STEP_LABEL: Record<StepKey, string> = {
  status: "Card status",
  permissions: "Merchant permissions",
  limits: "Spending limits",
  balances: "Balances",
};

export function periodStart(period: LimitPeriod, now: Date): Date | null {
  const d = new Date(now);
  switch (period) {
    case "per_txn":
      return null;
    case "daily":
      d.setHours(0, 0, 0, 0);
      return d;
    case "weekly": {
      d.setHours(0, 0, 0, 0);
      const dow = (d.getDay() + 6) % 7; // Monday start
      d.setDate(d.getDate() - dow);
      return d;
    }
    case "monthly":
      d.setHours(0, 0, 0, 0);
      d.setDate(1);
      return d;
  }
}

/** Approved spend on the card in the limit's current period, in the limit currency. */
export function spentInPeriod(card: Card, txns: Transaction[], now: Date): Money {
  const start = periodStart(card.limit.period, now) ?? periodStart("monthly", now)!;
  const cur = card.limit.amount.currency;
  const minor = txns
    .filter((t) => t.cardId === card.id && t.status === "approved" && new Date(t.at) >= start && new Date(t.at) <= now)
    .reduce((s, t) => s + convert(t.amount, cur).minor, 0);
  return { minor, currency: cur };
}

/** A live one-time approval for this card + merchant that covers this amount. */
export function activeApproval(card: Card, merchant: Merchant, amount: Money, ctx: AuthContext) {
  return ctx.requests.find(
    (r) =>
      r.kind === "one_time_approval" &&
      r.state === "approved" &&
      r.cardId === card.id &&
      r.merchantId === merchant.id &&
      r.windowEndsAt &&
      new Date(r.windowEndsAt) > ctx.now &&
      r.amount &&
      convert(amount, r.amount.currency).minor <= r.amount.minor
  );
}

export function authorize(card: Card, merchant: Merchant, amount: Money, ctx: AuthContext): Decision {
  const steps: Step[] = [];
  const approval = activeApproval(card, merchant, amount, ctx);

  const block = (key: StepKey, reason: DeclineReason, detail: string): Decision => {
    steps.push({ key, label: STEP_LABEL[key], result: "blocked", detail });
    for (const k of ["status", "permissions", "limits", "balances"] as StepKey[]) {
      if (!steps.find((s) => s.key === k)) steps.push({ key: k, label: STEP_LABEL[k], result: "skipped", detail: "Not checked" });
    }
    return { approved: false, steps, reason };
  };

  // 1. Status
  if (card.status === "frozen") return block("status", "frozen", "Card is frozen");
  if (card.status === "canceled") return block("status", "canceled", "Card is canceled");
  if (card.validUntil && new Date(card.validUntil) <= ctx.now) return block("status", "expired", "Card has expired");
  const day = ctx.now.toISOString().slice(0, 10);
  if ((card.activeFrom && day < card.activeFrom) || (card.activeUntil && day > card.activeUntil))
    return block("status", "outside_period", `Card only works ${card.activeFrom ?? "…"} to ${card.activeUntil ?? "…"}`);
  if (card.singleUse && card.used) return block("status", "expired", "Single-use card already used");
  steps.push({ key: "status", label: STEP_LABEL.status, result: "passed", detail: "Card is active" });

  // 2. Permissions
  const p = card.permissions;
  const sub = ctx.subscriptions?.find((s) => s.cardId === card.id && s.merchantId === merchant.id);
  const allowOnce = sub?.allowNextAttempt;
  const permBlock = (): [DeclineReason, string] | null => {
    if (card.lockedMerchantId && card.lockedMerchantId !== merchant.id)
      return ["merchant_not_allowed", "Card is locked to another merchant"];
    if (p.blockedMerchantIds.includes(merchant.id)) return ["merchant_blocked", `${merchant.name} is blocked on this card`];
    if (p.blockedCategories.includes(merchant.category))
      return ["category_blocked", `${CATEGORY_LABEL[merchant.category]} is blocked on this card`];
    if (p.mode === "merchants" && !p.allowedMerchantIds.includes(merchant.id))
      return ["merchant_not_allowed", `${merchant.name} isn't an approved merchant`];
    if (p.mode === "categories" && !p.allowedCategories.includes(merchant.category))
      return ["category_blocked", `${CATEGORY_LABEL[merchant.category]} isn't an allowed category`];
    return null;
  };
  // Card controls (personal track). All simulated charges are online.
  if (card.controls && !card.controls.online) return block("permissions", "card_control", "Online payments are turned off for this card");
  if (card.controls && !card.controls.foreignCurrency && amount.currency !== "NGN")
    return block("permissions", "card_control", "Payments in other currencies are turned off for this card");
  const pb = permBlock();
  if (pb && !approval && !allowOnce) return block("permissions", pb[0], pb[1]);
  steps.push({
    key: "permissions",
    label: STEP_LABEL.permissions,
    result: "passed",
    detail: pb ? (approval ? "Allowed once by owner approval" : "Next attempt allowed by owner") : describeAllowed(card, merchant),
  });

  // 3. Limits
  const inLimitCur = convert(amount, card.limit.amount.currency);
  if (card.limit.period === "per_txn") {
    if (inLimitCur.minor > card.limit.amount.minor && !approval)
      return block("limits", "per_charge_limit", `Above the ${format(card.limit.amount)} per-charge limit`);
  } else {
    const spent = spentInPeriod(card, ctx.transactions, ctx.now);
    if (spent.minor + inLimitCur.minor > card.limit.amount.minor && !approval)
      return block("limits", "spend_limit", `${format(spent)} of ${format(card.limit.amount)} already spent this period`);
  }
  steps.push({
    key: "limits",
    label: STEP_LABEL.limits,
    result: "passed",
    detail: approval ? "Within the one-time approval" : "Within the card's limit",
  });

  // 4. Balances
  const r = route(amount, card.funding, ctx.balances);
  if (!r.ok) {
    steps.push({
      key: "balances",
      label: STEP_LABEL.balances,
      result: "blocked",
      detail: "None of the eligible balances could cover it",
      attempts: r.attempts,
    });
    return { approved: false, steps, reason: "insufficient_balance" };
  }
  steps.push({
    key: "balances",
    label: STEP_LABEL.balances,
    result: "passed",
    detail: r.legs.length > 1 ? `Split across ${r.legs.length} sources` : "Covered by one source",
    attempts: r.attempts,
  });
  return { approved: true, steps, legs: r.legs, feeAvoided: r.feeAvoided, viaApprovalId: approval?.id };
}

function describeAllowed(card: Card, merchant: Merchant): string {
  if (card.lockedMerchantId) return `Card is locked to ${merchant.name}`;
  switch (card.permissions.mode) {
    case "anywhere":
      return "Card can be used anywhere except blocked categories";
    case "first_merchant":
      return `First charge on this card: it will lock to ${merchant.name}`;
    case "merchants":
      return `${merchant.name} is an approved merchant`;
    case "categories":
      return `${CATEGORY_LABEL[merchant.category]} is an allowed category`;
  }
}
