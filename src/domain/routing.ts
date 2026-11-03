// Card payments. Cards are prefunded, so a charge only ever comes out of the card's own balance.
// If the card holds less than the charge (plus an FX fee when the charge is in another currency),
// it is declined. Topping up a card is a separate step: see `fundingCost`.
import { cardFundingFee } from "./fees";
import { convert, fxFeeBps, rate } from "./money";
import type { Currency, FeeAvoided, FundingLeg, Money } from "./types";

export type BalanceAttempt = {
  source: { kind: "card"; currency: Currency };
  outcome: "used" | "empty";
  note: string;
};

export type RouteResult =
  | {
      ok: true;
      legs: FundingLeg[];
      attempts: BalanceAttempt[];
      feeAvoided?: FeeAvoided;
    }
  | { ok: false; attempts: BalanceAttempt[] };

/** Pays `charge` from the card's balance, converting (with the FX fee) when the charge is in another currency. */
export function route(charge: Money, cardBalance: Money): RouteResult {
  const cur = cardBalance.currency;
  const feeBps = fxFeeBps(cur, charge.currency);
  const base = convert(charge, cur);
  const fee = Math.round((base.minor * feeBps) / 10_000);
  const debit: Money = { minor: base.minor + fee, currency: cur };
  const source = { kind: "card", currency: cur } as const;
  if (cardBalance.minor < debit.minor)
    return {
      ok: false,
      attempts: [
        {
          source,
          outcome: "empty",
          note: `Card balance is lower than the ${debit.minor / 100} needed`,
        },
      ],
    };
  const leg: FundingLeg =
    cur === charge.currency
      ? { source, debit, covers: charge }
      : {
          source,
          debit,
          covers: charge,
          fx: {
            from: cur,
            rate: rate(cur, charge.currency),
            fee: { minor: fee, currency: cur },
            converted: charge,
          },
        };
  return {
    ok: true,
    legs: [leg],
    attempts: [{ source, outcome: "used", note: "Card balance covered it" }],
  };
}

/** What topping up a card costs: `amount` (in the card's currency) taken from an account balance in `from`, plus the card funding fee and any FX fee. */
export function fundingCost(
  amount: Money,
  from: Currency,
): { debit: Money; fee: Money; cardFee: Money; fx: boolean } {
  const base = convert(amount, from);
  const cardFee = convert(cardFundingFee(amount), from);
  const fee =
    from === amount.currency
      ? 0
      : Math.round((base.minor * fxFeeBps(from, amount.currency)) / 10_000);
  return {
    debit: { minor: base.minor + fee + cardFee.minor, currency: from },
    fee: { minor: fee, currency: from },
    cardFee,
    fx: from !== amount.currency,
  };
}
