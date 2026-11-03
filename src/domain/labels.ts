import type {
  CardDesign,
  CardStatus,
  Category,
  PermissionMode,
  SubscriptionFrequency,
} from "./types";

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
export const DEFAULT_BLOCKED_CATEGORIES: Category[] = [
  "gambling",
  "cash_atm",
  "crypto",
];

export const STATUS_LABEL: Record<CardStatus, string> = {
  active: "Active",
  frozen: "Frozen",
  canceled: "Terminated",
};

export const DESIGN_LABEL: Record<CardDesign, string> = {
  ink: "Ink",
  silver: "Silver",
  cobalt: "Cobalt",
  clay: "Clay",
  chalk: "Chalk",
  lime: "Lime",
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
