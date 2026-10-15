import type { Currency } from "@/domain/types";

/** Countries a traveller can pick, mapped to the currency charges there will be in. Prototype list. */
export const COUNTRIES: { code: string; name: string; currency: Currency }[] = [
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "ES", name: "Spain", currency: "EUR" },
  { code: "IT", name: "Italy", currency: "EUR" },
  { code: "NL", name: "Netherlands", currency: "EUR" },
  { code: "IE", name: "Ireland", currency: "EUR" },
  { code: "NG", name: "Nigeria", currency: "NGN" },
];

export const countryByCode = (code: string | null | undefined) => COUNTRIES.find((c) => c.code === code);
