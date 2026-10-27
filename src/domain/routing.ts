// SmartRoute: decides which balance(s) pay a charge.
//
// Prototype semantics (open question §2.2 — validate with product/engineering):
// - cheapest_fx: same-currency balance first, then other balances by lowest FX fee.
//   One charge may be split across balances.
// - protect: like cheapest_fx, but the protected currency (the user's choice) is only used when nothing else can cover it.
// - custom: balances are tried in the saved order; one charge may also be split.
// - Cards only ever pay from Foren balances. If they can't cover the charge, it's declined.
import { CURRENCIES, convert, fxFeeBps, rate, sub, zero } from "./money";
import type { Balance, Currency, FeeAvoided, FundingConfig, FundingLeg, Money } from "./types";

export type BalanceAttempt = {
  source: { kind: "balance"; currency: Currency };
  outcome: "used" | "partial" | "empty";
  note: string;
};

export type RouteResult =
  | { ok: true; legs: FundingLeg[]; attempts: BalanceAttempt[]; feeAvoided?: FeeAvoided }
  | { ok: false; attempts: BalanceAttempt[] };

export function balanceOrder(cfg: FundingConfig, chargeCurrency: Currency): Currency[] {
  if (cfg.strategy === "custom") return cfg.order;
  const byFee = [...CURRENCIES].sort((a, b) => {
    const fa = fxFeeBps(a, chargeCurrency);
    const fb = fxFeeBps(b, chargeCurrency);
    if (fa !== fb) return fa - fb;
    return CURRENCIES.indexOf(a) - CURRENCIES.indexOf(b);
  });
  const eligible = byFee.filter((c) => cfg.order.includes(c));
  const kept = cfg.strategy === "protect" ? cfg.protect : undefined;
  if (kept && chargeCurrency !== kept) {
    return [...eligible.filter((c) => c !== kept), ...eligible.filter((c) => c === kept)];
  }
  return eligible;
}

export function route(charge: Money, cfg: FundingConfig, balances: Balance[]): RouteResult {
  const order = balanceOrder(cfg, charge.currency);
  let remaining = charge;
  const legs: FundingLeg[] = [];
  const attempts: BalanceAttempt[] = [];

  for (const cur of order) {
    if (remaining.minor <= 0) break;
    const bal = balances.find((b) => b.currency === cur);
    if (!bal || bal.available.minor <= 0) {
      attempts.push({ source: { kind: "balance", currency: cur }, outcome: "empty", note: `No ${cur} available` });
      continue;
    }
    // What the remaining charge costs in this balance's currency, including FX fee.
    const feeBps = fxFeeBps(cur, charge.currency);
    const needBase = convert(remaining, cur);
    const needFee = Math.round((needBase.minor * feeBps) / 10_000);
    const need = needBase.minor + needFee;

    if (bal.available.minor >= need) {
      legs.push(leg(cur, charge.currency, remaining, needBase.minor, needFee));
      attempts.push({ source: { kind: "balance", currency: cur }, outcome: "used", note: `${cur} balance covered it` });
      remaining = zero(charge.currency);
    } else {
      // Split: use what this balance can cover.
      const usableBase = Math.floor((bal.available.minor * 10_000) / (10_000 + feeBps));
      const usableFee = bal.available.minor - usableBase;
      const covers = convert({ minor: usableBase, currency: cur }, charge.currency);
      if (covers.minor <= 0) {
        attempts.push({ source: { kind: "balance", currency: cur }, outcome: "empty", note: `${cur} balance too low` });
        continue;
      }
      legs.push(leg(cur, charge.currency, covers, usableBase, usableFee));
      attempts.push({ source: { kind: "balance", currency: cur }, outcome: "partial", note: `${cur} balance covered part` });
      remaining = sub(remaining, covers);
    }
  }

  if (remaining.minor > 0) return { ok: false, attempts };
  return { ok: true, legs, attempts, feeAvoided: feeAvoided(charge, legs) };
}

function leg(from: Currency, to: Currency, covers: Money, baseMinor: number, feeMinor: number): FundingLeg {
  const debit: Money = { minor: baseMinor + feeMinor, currency: from };
  if (from === to) return { source: { kind: "balance", currency: from }, debit, covers };
  return {
    source: { kind: "balance", currency: from },
    debit,
    covers,
    fx: { from, rate: rate(from, to), fee: { minor: feeMinor, currency: from }, converted: covers },
  };
}

/**
 * Fee avoided is only claimed when the whole charge was paid from a same-currency balance,
 * compared against converting the same amount from USD at the Foren fee.
 * (Final comparison basis is an open question — §12.)
 */
function feeAvoided(charge: Money, legs: FundingLeg[]): FeeAvoided | undefined {
  // NGN is the home currency for these accounts — paying naira from naira isn't a saving worth claiming.
  if (charge.currency === "USD" || charge.currency === "NGN") return undefined;
  if (legs.length !== 1 || legs[0].fx) return undefined;
  const usd = convert(charge, "USD");
  const fee = Math.round((usd.minor * fxFeeBps("USD", charge.currency)) / 10_000);
  if (fee <= 0) return undefined;
  return {
    amount: { minor: fee, currency: "USD" },
    basis: `Compared with converting from your USD balance at the ${fxFeeBps("USD", charge.currency) / 100}% Foren FX fee.`,
  };
}
