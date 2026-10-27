import { asset } from "@/lib/base-path";

/** Prototype-only figures for the foren.co rates section. Not live rates. */
export type Currency = { code: string; name: string; flag: string; symbol: string; dial?: string };

const flag = (c: string) => asset(`/website/flags/${c}.svg`);

export const CURRENCIES: Record<string, Currency> = {
  NGN: { code: "NGN", name: "Nigerian naira", flag: flag("ng"), symbol: "₦", dial: "+234" },
  GBP: { code: "GBP", name: "Pound sterling", flag: flag("gb"), symbol: "£", dial: "+44" },
  CAD: { code: "CAD", name: "Canadian dollar", flag: flag("ca"), symbol: "CA$", dial: "+1" },
  KES: { code: "KES", name: "Kenyan shilling", flag: flag("ke"), symbol: "KSh", dial: "+254" },
  GHS: { code: "GHS", name: "Ghanaian cedi", flag: flag("gh"), symbol: "GH₵", dial: "+233" },
  USD: { code: "USD", name: "US dollar", flag: flag("us"), symbol: "$", dial: "+1" },
  EUR: { code: "EUR", name: "Euro", flag: flag("eu"), symbol: "€" },
  CNY: { code: "CNY", name: "Chinese yuan", flag: flag("cn"), symbol: "¥" },
};

/** Units of each currency per 1 USD. NGN matches the website Figma (1 USD ≈ 1,580.45). */
const PER_USD: Record<string, number> = { USD: 1, NGN: 1580.45, GBP: 0.79, EUR: 0.92, CAD: 1.37, KES: 129.2, GHS: 15.6, CNY: 7.12 };

export const rate = (from: string, to: string) => PER_USD[to] / PER_USD[from];

/** Quote on WhatsApp: what visitors pay in, and what their suppliers receive. */
export const PAY_IN = ["NGN", "GBP", "CAD", "KES", "GHS"];
export const RECEIVE_IN = ["USD", "EUR", "GBP", "CNY", "CAD"];
export const CALCULATOR = ["NGN", "USD", "GBP", "EUR", "CAD", "KES", "GHS", "CNY"];

/** WhatsApp country codes for the phone fields, keyed by country (US and Canada share +1). Foren's markets first. */
const DIAL: [iso: string, country: string, code: string][] = [
  ["ng", "Nigeria", "+234"],
  ["gb", "United Kingdom", "+44"],
  ["ca", "Canada", "+1"],
  ["ke", "Kenya", "+254"],
  ["gh", "Ghana", "+233"],
  ["us", "United States", "+1"],
  ["za", "South Africa", "+27"],
  ["ug", "Uganda", "+256"],
  ["tz", "Tanzania", "+255"],
  ["rw", "Rwanda", "+250"],
  ["cm", "Cameroon", "+237"],
  ["sn", "Senegal", "+221"],
  ["ci", "Côte d’Ivoire", "+225"],
  ["eg", "Egypt", "+20"],
  ["ma", "Morocco", "+212"],
  ["ie", "Ireland", "+353"],
  ["fr", "France", "+33"],
  ["de", "Germany", "+49"],
  ["nl", "Netherlands", "+31"],
  ["es", "Spain", "+34"],
  ["it", "Italy", "+39"],
  ["ae", "United Arab Emirates", "+971"],
  ["sa", "Saudi Arabia", "+966"],
  ["in", "India", "+91"],
  ["pk", "Pakistan", "+92"],
  ["cn", "China", "+86"],
  ["hk", "Hong Kong", "+852"],
  ["sg", "Singapore", "+65"],
  ["au", "Australia", "+61"],
  ["br", "Brazil", "+55"],
];
export const DIAL_CODES = DIAL.map(([iso, country, code]) => ({ iso, country, code, flag: flag(iso) }));
export const dialFor = (iso: string) => DIAL_CODES.find((d) => d.iso === iso) ?? DIAL_CODES[0];

/** The visitor's country from their browser language (en-GB → gb), if we list it. */
export function defaultDialIso() {
  if (typeof navigator === "undefined") return "ng";
  for (const lang of navigator.languages ?? [navigator.language]) {
    const region = lang.split("-")[1]?.toLowerCase();
    if (region && DIAL_CODES.some((d) => d.iso === region)) return region;
  }
  return "ng";
}

/** Foren's WhatsApp line for quotes (09038174098). */
export const FOREN_WHATSAPP = "2349038174098";

export const whatsappLink = (text: string) => `https://wa.me/${FOREN_WHATSAPP}?text=${encodeURIComponent(text)}`;

export const formatAmount = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
