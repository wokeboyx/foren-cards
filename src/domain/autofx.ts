// AutoFX goal evaluation. Creating a goal never moves money; only a run (tick) can act.
import { convert, format, formatRate, fxFeeBps, rate } from "./money";
import type { AutoFxGoal, Balance, Currency, GoalStatus, Money } from "./types";

export type GoalEval = {
  status: GoalStatus;
  /** 0..1 where meaningful */
  progress: number | null;
  message: string;
  nextStep?: string;
};

const bal = (balances: Balance[], c: Currency) => balances.find((b) => b.currency === c)?.available ?? { minor: 0, currency: c };

export function goalSentence(g: Pick<AutoFxGoal, "type" | "currency" | "threshold" | "counterCurrency" | "amount" | "targetRate">): string {
  switch (g.type) {
    case "keep_min":
      return `Keep at least ${g.threshold ? format(g.threshold, { code: true }) : `— ${g.currency}`}; top up from ${g.counterCurrency}.`;
    case "target_rate":
      return `Convert ${g.amount ? format(g.amount, { code: true }) : `— ${g.currency}`} to ${g.counterCurrency} when 1 ${g.currency} reaches ${g.targetRate ?? "—"} ${g.counterCurrency}.`;
    case "cap":
      return `Cap ${g.currency} at ${g.threshold ? format(g.threshold, { code: true }) : "—"}; move anything above it to ${g.counterCurrency}.`;
  }
}

export function evaluateGoal(g: AutoFxGoal, balances: Balance[]): GoalEval {
  const last = g.actions.at(-1);
  if (g.type === "keep_min") {
    const b = bal(balances, g.currency);
    const t = g.threshold!;
    const progress = Math.min(1, b.minor / t.minor);
    if (b.minor >= t.minor)
      return last
        ? { status: "action_taken", progress, message: last.text }
        : { status: "on_track", progress, message: `${format(b)} is above the ${format(t)} minimum.` };
    const shortfall: Money = { minor: t.minor - b.minor, currency: g.currency };
    const cost = convert(shortfall, g.counterCurrency);
    if (bal(balances, g.counterCurrency).minor < cost.minor)
      return {
        status: "unable_to_act",
        progress,
        message: `${g.currency} is ${format(shortfall)} below the minimum, but there isn’t enough ${g.counterCurrency} to top it up.`,
        nextStep: `Add ${g.counterCurrency} to your account or choose another source currency.`,
      };
    return { status: "on_track", progress, message: `Below the minimum by ${format(shortfall)}. Foren will top up from ${g.counterCurrency} on the next check.` };
  }
  if (g.type === "target_rate") {
    if (g.completed && last) return { status: "action_taken", progress: 1, message: last.text };
    const current = rate(g.currency, g.counterCurrency);
    const progress = Math.min(1, current / g.targetRate!);
    if (bal(balances, g.currency).minor < g.amount!.minor)
      return {
        status: "unable_to_act",
        progress,
        message: `Your ${g.currency} balance is lower than the ${format(g.amount!)} this goal converts.`,
        nextStep: `Add ${g.currency} or lower the goal amount.`,
      };
    return {
      status: current >= g.targetRate! ? "on_track" : "waiting_for_rate",
      progress,
      message: `Today: ${formatRate(g.currency, g.counterCurrency, current)}. Target: ${g.targetRate} ${g.counterCurrency}.`,
    };
  }
  // cap
  const b = bal(balances, g.currency);
  const t = g.threshold!;
  if (b.minor <= t.minor)
    return last
      ? { status: "action_taken", progress: b.minor / t.minor, message: last.text }
      : { status: "on_track", progress: b.minor / t.minor, message: `${format(b)} is within the ${format(t)} cap.` };
  return { status: "on_track", progress: 1, message: `${format({ minor: b.minor - t.minor, currency: g.currency })} above the cap. Foren will move it on the next check.` };
}

export type GoalAction = { goalId: string; debit: Money; credit: Money; fee: Money; text: string };

/** What a check run would do right now. Pure — the store applies the result. */
export function planGoal(g: AutoFxGoal, balances: Balance[]): GoalAction | null {
  if (g.type === "keep_min") {
    const b = bal(balances, g.currency);
    if (b.minor >= g.threshold!.minor) return null;
    const credit: Money = { minor: g.threshold!.minor - b.minor, currency: g.currency };
    return conversion(g, g.counterCurrency, credit, balances, `Topped up ${g.currency}`);
  }
  if (g.type === "target_rate") {
    if (g.completed) return null;
    if (rate(g.currency, g.counterCurrency) < g.targetRate!) return null;
    if (bal(balances, g.currency).minor < g.amount!.minor) return null;
    const fee = { minor: Math.round((g.amount!.minor * fxFeeBps(g.currency, g.counterCurrency)) / 10_000), currency: g.currency };
    const credit = convert({ minor: g.amount!.minor - fee.minor, currency: g.currency }, g.counterCurrency);
    return {
      goalId: g.id,
      debit: g.amount!,
      credit,
      fee,
      text: `Converted ${format(g.amount!)} to ${format(credit)} at ${formatRate(g.currency, g.counterCurrency, rate(g.currency, g.counterCurrency))}. Fee ${format(fee)}.`,
    };
  }
  const b = bal(balances, g.currency);
  if (b.minor <= g.threshold!.minor) return null;
  const debit: Money = { minor: b.minor - g.threshold!.minor, currency: g.currency };
  const fee = { minor: Math.round((debit.minor * fxFeeBps(g.currency, g.counterCurrency)) / 10_000), currency: g.currency };
  const credit = convert({ minor: debit.minor - fee.minor, currency: g.currency }, g.counterCurrency);
  return { goalId: g.id, debit, credit, fee, text: `Moved ${format(debit)} above the cap to ${format(credit)}. Fee ${format(fee)}.` };
}

function conversion(g: AutoFxGoal, from: Currency, credit: Money, balances: Balance[], verb: string): GoalAction | null {
  const base = convert(credit, from);
  const fee = { minor: Math.round((base.minor * fxFeeBps(from, credit.currency)) / 10_000), currency: from };
  const debit = { minor: base.minor + fee.minor, currency: from };
  if (bal(balances, from).minor < debit.minor) return null;
  return { goalId: g.id, debit, credit, fee, text: `${verb} by ${format(credit)} using ${format(debit)}, including a ${format(fee)} fee.` };
}
