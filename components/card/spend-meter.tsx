"use client";
import { ForenProgress } from "@/components/ui/foren-progress";
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

export function SpendMeter({ card, txns, now, compact }: { card: Card; txns: Transaction[]; now: Date; compact?: boolean }) {
  const s = spendSummary(card, txns, now);
  if (compact) {
    return (
      <div className="min-w-[140px]">
        <div className="tnum text-[13px] font-medium text-fg">{s.short}</div>
        {s.ratio !== null ? (
          <ForenProgress size="sm" value={s.ratio * 100} hideValue className="mt-1.5" aria-label={s.sentence} fillColor={s.ratio >= 0.9 ? "var(--color-foren-warning)" : undefined} />
        ) : (
          <div className="mt-0.5 text-[12px] text-fg-3">Per-charge limit</div>
        )}
      </div>
    );
  }
  return (
    <div>
      {s.ratio !== null && (
        <ForenProgress size="md" value={s.ratio * 100} hideValue aria-label="Spend against limit" fillColor={s.ratio >= 0.9 ? "var(--color-foren-warning)" : undefined} />
      )}
      <p className="tnum mt-2 text-[14px] leading-[22px] text-fg-2">{s.sentence}</p>
    </div>
  );
}
