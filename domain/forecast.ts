// Subscription forecasting — always an estimate, never a merchant-confirmed date.
import { POLICY } from "@/config/policy";
import { authorize, type AuthContext } from "./authorize";
import type { Card, DeclineReason, Merchant, Money, Subscription } from "./types";

export type Forecast =
  | { kind: "estimate"; date: Date; amount: Money; daysAway: number }
  | { kind: "insufficient_history" };

const DAY = 86_400_000;

export function addInterval(d: Date, f: Subscription["frequency"]): Date {
  const x = new Date(d);
  if (f === "weekly") x.setDate(x.getDate() + 7);
  if (f === "monthly") x.setMonth(x.getMonth() + 1);
  if (f === "quarterly") x.setMonth(x.getMonth() + 3);
  if (f === "yearly") x.setFullYear(x.getFullYear() + 1);
  return x;
}

export function lastCharge(s: Subscription): Date | null {
  if (!s.chargeDates.length) return null;
  return new Date([...s.chargeDates].sort().at(-1)!);
}

export function forecast(s: Subscription, now: Date): Forecast {
  if (s.chargeDates.length < POLICY.forecastMinCharges) return { kind: "insufficient_history" };
  let next = addInterval(lastCharge(s)!, s.frequency);
  // If the expected date passed without a charge, roll forward (still an estimate).
  while (next.getTime() < now.getTime() - DAY) next = addInterval(next, s.frequency);
  const daysAway = Math.max(0, Math.ceil((next.getTime() - now.getTime()) / DAY));
  return { kind: "estimate", date: next, amount: s.usualAmount, daysAway };
}

export type SubStatus =
  | { kind: "blocked" }
  | { kind: "still_on_old_card"; newCardId: string }
  | { kind: "declined"; reason: DeclineReason; at: string }
  | { kind: "at_risk"; reason: DeclineReason }
  | { kind: "due_soon" }
  | { kind: "active" };

/**
 * Status shown on a subscription row. "At risk" runs the expected charge through the
 * real authorisation engine against today's balances and card state.
 */
export function subscriptionStatus(s: Subscription, card: Card, merchant: Merchant, ctx: AuthContext): SubStatus {
  if (s.blocked) return { kind: "blocked" };
  if (s.movingToCardId) return { kind: "still_on_old_card", newCardId: s.movingToCardId };
  const f = forecast(s, ctx.now);
  // Only warn within 30 days and only when there is a supported estimate.
  if (f.kind === "estimate" && f.daysAway <= 30) {
    const d = authorize(card, merchant, f.amount, { ...ctx, now: f.date });
    if (!d.approved) {
      if (s.lastDecline && new Date(s.lastDecline.at) > new Date(ctx.now.getTime() - 14 * DAY))
        return { kind: "declined", reason: s.lastDecline.reason, at: s.lastDecline.at };
      return { kind: "at_risk", reason: d.reason };
    }
  }
  if (s.lastDecline && new Date(s.lastDecline.at) > new Date(ctx.now.getTime() - 14 * DAY) && card.status !== "active")
    return { kind: "declined", reason: s.lastDecline.reason, at: s.lastDecline.at };
  if (f.kind === "estimate" && f.daysAway <= 7) return { kind: "due_soon" };
  return { kind: "active" };
}
