import type { CardDesign, CardStatus, Category, FundingStrategy, LimitPeriod, PermissionMode, SubscriptionFrequency, FundingConfig } from "./types";

export const CATEGORY_LABEL: Record<Category, string> = {
  software: "Software",
  travel: "Travel",
  advertising: "Advertising",
  office: "Office supplies",
  food: "Food & drink",
  transport: "Transport",
  utilities: "Utilities",
  entertainment: "Entertainment",
  gambling: "Gambling",
  cash_atm: "Cash & ATM",
  crypto: "Crypto",
};

/** Foren's suggested protections — blocked by default on every new card. */
export const DEFAULT_BLOCKED_CATEGORIES: Category[] = ["gambling", "cash_atm", "crypto"];

export const STATUS_LABEL: Record<CardStatus, string> = {
  active: "Active",
  frozen: "Frozen",
  canceled: "Canceled",
};

export const DESIGN_LABEL: Record<CardDesign, string> = {
  midnight: "Midnight",
  skyline: "Skyline",
  aurora: "Aurora",
  cream: "Cream",
  lime: "Lime",
  titanium: "Titanium",
};

export const STRATEGY: Record<FundingStrategy, { label: string; line: string }> = {
  cheapest_fx: {
    label: "Cheapest FX",
    line: "Pays from the balance that costs least to convert. One charge may be split across balances.",
  },
  protect: {
    label: "Protect a currency",
    line: "Spends your other balances first. The currency you protect is only used when nothing else can cover the charge.",
  },
  custom: {
    label: "Custom order",
    line: "Tries your balances in the order you set.",
  },
};

export const PERIOD_LABEL: Record<LimitPeriod, string> = {
  per_txn: "Per transaction",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const PERIOD_PHRASE: Record<LimitPeriod, string> = {
  per_txn: "per transaction",
  daily: "per day",
  weekly: "per week",
  monthly: "per month",
};

export const PERIOD_NOUN: Record<LimitPeriod, string> = {
  per_txn: "this charge",
  daily: "today",
  weekly: "this week",
  monthly: "this month",
};

export const MODE: Record<PermissionMode, string> = {
  anywhere: "Anywhere",
  first_merchant: "One merchant",
  merchants: "Selected merchants",
  categories: "Categories",
};

export const FREQUENCY_LABEL: Record<SubscriptionFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

/** Strategy name for lists and summaries, naming the protected currency (e.g. "Protect GBP"). */
export function strategyLabel(f: Pick<FundingConfig, "strategy" | "protect">): string {
  return f.strategy === "protect" && f.protect ? `Protect ${f.protect}` : STRATEGY[f.strategy].label;
}
