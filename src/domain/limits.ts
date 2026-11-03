import { POLICY } from "@/config/policy";
import { convert, format } from "./money";
import type { Card, Limit, Money } from "./types";

export type LimitErrors = { daily?: string; txn?: string };

/** Both limits are required, positive, within range, and the per-transaction limit can't exceed the daily one. */
export function validateLimits(
  daily: Money | null,
  txn: Money | null,
): LimitErrors {
  const errors: LimitErrors = {};
  const max = (m: Money) => POLICY.maxLimitMajor[m.currency] * 100;
  if (!daily || daily.minor <= 0) errors.daily = "Enter a daily limit.";
  else if (daily.minor > max(daily))
    errors.daily = "That’s above the highest limit we allow.";
  if (!txn || txn.minor <= 0) errors.txn = "Enter a transaction limit.";
  else if (txn.minor > max(txn))
    errors.txn = "That’s above the highest limit we allow.";
  if (
    !errors.daily &&
    !errors.txn &&
    daily &&
    txn &&
    convert(txn, daily.currency).minor > daily.minor
  )
    errors.txn = "The transaction limit can’t be more than the daily limit.";
  return errors;
}

export function defaultLimit(): Limit {
  return {
    daily: { ...POLICY.defaultLimit.daily },
    txn: { ...POLICY.defaultLimit.txn },
  };
}

/** Cards expire this many months after creation, as yyyy-mm. */
export function expiryFrom(date: Date): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + POLICY.cardExpiryMonths);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** The last moment a card works: the end of its expiry month. */
export function expiryEnd(expiry: string): Date {
  const [y, m] = expiry.split("-").map(Number);
  return new Date(y, m, 1);
}

export function isExpired(card: Pick<Card, "expiry">, now: Date): boolean {
  return expiryEnd(card.expiry) <= now;
}

/** Active card that stops working within POLICY.expiringSoonDays (a card works through the end of its expiry month). */
export function isExpiringSoon(
  card: Pick<Card, "expiry" | "status" | "kind">,
  now: Date,
): boolean {
  if (
    card.status === "canceled" ||
    card.kind === "emergency" ||
    isExpired(card, now)
  )
    return false;
  return (
    expiryEnd(card.expiry).getTime() - now.getTime() <=
    POLICY.expiringSoonDays * 86_400_000
  );
}

export function activeCardCount(
  cards: Pick<Card, "status" | "personal" | "archived">[],
): number {
  return cards.filter((c) => c.status !== "canceled" && !c.archived).length;
}

/** One-line summary, e.g. "$1,000.00 a day · $500.00 a transaction". */
export function limitSummary(
  l: Limit,
  opts: { compact?: boolean } = {},
): string {
  return `${format(l.daily, opts)} a day · ${format(l.txn, opts)} a transaction`;
}
