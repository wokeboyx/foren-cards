import { spentInPeriod } from "@/domain/authorize";
import { PERIOD_NOUN, PERIOD_PHRASE } from "@/domain/labels";
import { format } from "@/domain/money";
import type { Card, Transaction } from "@/domain/types";

export function spendSummary(card: Card, txns: Transaction[], now: Date) {
  if (card.limit.period === "per_txn") {
    return { ratio: null, sentence: `Up to ${format(card.limit.amount)} per transaction.`, short: `${format(card.limit.amount)} / charge` };
  }
  const spent = spentInPeriod(card, txns, now);
  const left = Math.max(0, card.limit.amount.minor - spent.minor);
  const ratio = Math.min(1, spent.minor / card.limit.amount.minor);
  return {
    ratio,
    spent,
    sentence: `${format(spent)} of ${format(card.limit.amount)} spent ${PERIOD_NOUN[card.limit.period]}. ${format({ minor: left, currency: spent.currency })} left.`,
    short: `${format(spent, { compact: spent.currency === "NGN" })} of ${format(card.limit.amount, { compact: true })}`,
    phrase: PERIOD_PHRASE[card.limit.period],
  };
}
