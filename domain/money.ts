import type { Currency, Money } from "./types";

export const CURRENCIES: Currency[] = ["USD", "GBP", "EUR", "NGN", "CAD"];

export const CURRENCY_NAME: Record<Currency, string> = {
  USD: "United States dollar",
  GBP: "British pound sterling",
  EUR: "Euro",
  NGN: "Nigerian naira",
  CAD: "Canadian dollar",
};

/** Test-data mid-market rates: units of currency per 1 USD. Mutable so the demo panel can move rates. */
export const DEFAULT_USD_RATES: Record<Currency, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  NGN: 1540,
  CAD: 1.37,
};
export const USD_RATES: Record<Currency, number> = { ...DEFAULT_USD_RATES };

export function setRates(next: Partial<Record<Currency, number>>) {
  Object.assign(USD_RATES, next);
}

/** Foren FX fee in basis points (test data). */
export function fxFeeBps(from: Currency, to: Currency): number {
  if (from === to) return 0;
  if (from === "NGN" || to === "NGN") return 150;
  return 50;
}

export const money = (major: number, currency: Currency): Money => ({
  minor: Math.round(major * 100),
  currency,
});

export const zero = (currency: Currency): Money => ({ minor: 0, currency });

/** Units of `to` per 1 unit of `from`. */
export function rate(from: Currency, to: Currency, rates = USD_RATES): number {
  return rates[to] / rates[from];
}

export function convert(m: Money, to: Currency, rates = USD_RATES): Money {
  if (m.currency === to) return m;
  return { minor: Math.round(m.minor * rate(m.currency, to, rates)), currency: to };
}

export function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch ${a.currency}/${b.currency}`);
  return { minor: a.minor + b.minor, currency: a.currency };
}

export function sub(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error(`Currency mismatch ${a.currency}/${b.currency}`);
  return { minor: a.minor - b.minor, currency: a.currency };
}

export function format(m: Money, opts: { code?: boolean; compact?: boolean } = {}): string {
  const major = m.minor / 100;
  const s = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: m.currency,
    currencyDisplay: m.currency === "CAD" ? "symbol" : "narrowSymbol",
    notation: opts.compact ? "compact" : "standard",
    minimumFractionDigits: opts.compact ? 0 : 2,
    maximumFractionDigits: opts.compact ? 1 : 2,
  }).format(major);
  return opts.code ? `${s} ${m.currency}` : s;
}

export function formatRate(from: Currency, to: Currency, r: number): string {
  const digits = r >= 100 ? 2 : 4;
  return `1 ${from} = ${r.toFixed(digits)} ${to}`;
}

/** Parse a user-typed amount ("1,240.50") into minor units. Returns null when malformed. */
export function parseAmount(input: string, currency: Currency): Money | null {
  const clean = input.replace(/[,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(clean)) return null;
  return { minor: Math.round(Number(clean) * 100), currency };
}
