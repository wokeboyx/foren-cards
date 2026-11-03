import type { BadgeColor } from "@/components/ui/foren-badge";
import { DECLINE } from "@/content/copy";
import type { ExpenseCategory, Transaction } from "@/domain/types";
import { useAppStore } from "@/stores/app";

export const dt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Receipts are expected on approved business charges (Mercury / Revolut expense reporting). */
export function needsReceipt(t: Transaction) {
  return (
    t.kind !== "funding" &&
    t.status === "approved" &&
    !t.receipt &&
    !!useAppStore().cards.find((c) => c.id === t.cardId && !c.personal)
  );
}

export function txStatus(t: Transaction): { label: string; color: BadgeColor } {
  if (t.kind === "funding") return { label: "Funded", color: "success" };
  if (t.status === "declined") return { label: "Declined", color: "error" };
  if (t.status === "pending") return { label: "Pending", color: "gray" };
  if (t.status === "refunded") return { label: "Refunded", color: "gray" };
  if (needsReceipt(t)) return { label: "Missing receipt", color: "orange" };
  if (t.feeAvoided) return { label: "Fee avoided", color: "success" };
  return { label: "Paid", color: "success" };
}

export function ownerNext(t: Transaction) {
  switch (t.declineReason) {
    case "frozen":
      return "Unfreeze the card if this charge was expected.";
    case "merchant_blocked":
      return "Unblock this merchant on the card, or approve one charge if the cardholder asks.";
    case "category_blocked":
    case "merchant_not_allowed":
      return "Review the card’s merchant permissions if this charge was expected.";
    case "per_charge_limit":
    case "spend_limit":
      return "Review the card’s spending limit if this charge was expected.";
    case "insufficient_balance":
      return "Fund the card. It only spends what’s on it.";
    default:
      return DECLINE[t.declineReason ?? "unknown"].next;
  }
}

export const EXPENSE: Record<ExpenseCategory, string> = {
  travel: "Travel",
  meals: "Meals & entertainment",
  software: "Software",
  marketing: "Marketing",
  office: "Office & supplies",
  transport: "Local transport",
  other: "Other",
};

/** A short reference shown in the first column, as on the Global account history. */
export const txRef = (t: Transaction) =>
  `TX-${t.id
    .replace(/[^a-z0-9]/gi, "")
    .slice(-8)
    .toUpperCase()}`;

/** Card payments are debits; refunds come back as credits. */
export const txType = (
  t: Transaction,
): { label: "Debit" | "Credit"; color: BadgeColor } =>
  t.status === "refunded" || t.kind === "funding"
    ? { label: "Credit", color: "success" }
    : { label: "Debit", color: "gray" };
