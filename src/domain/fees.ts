import { POLICY } from "@/config/policy";
import { convert } from "./money";
import type { Money } from "./types";

type Schedule = { bps: number; cap: Money };

/** A percentage of `amount`, capped, in the amount's currency (the cap is set in USD and converted). */
function percentFee(amount: Money, s: Schedule): Money {
  const pct = Math.round((amount.minor * s.bps) / 10_000);
  const cap = convert(s.cap, amount.currency).minor;
  return { minor: Math.min(pct, cap), currency: amount.currency };
}

/** Charged on top of the amount whenever money is put on a card. */
export const cardFundingFee = (amount: Money) =>
  percentFee(amount, POLICY.cardFundingFee);

/** Charged when money is taken off a card back to a balance. */
export const cardWithdrawalFee = (amount: Money) =>
  percentFee(amount, POLICY.cardWithdrawalFee);

/** "1% of the amount, capped at $100.00" */
export const feeScheduleText = (s: Schedule, format: (m: Money) => string) =>
  `${s.bps / 100}% of the amount, capped at ${format(s.cap)}`;
