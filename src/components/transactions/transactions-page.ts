import type { BadgeColor } from "@/components/ui/foren-badge";
import { DECLINE } from "@/content/copy";
import type { ExpenseCategory, Transaction } from "@/domain/types";
import { useAppStore } from "@/stores/app";

export const dt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Receipts are expected on approved business charges (Mercury / Revolut expense reporting). */
export function needsReceipt(t: Transaction) {
  return t.status === "approved" && !t.receipt && !!useAppStore().cards.find((c) => c.id === t.cardId && !c.personal);
}

export function txStatus(t: Transaction): { label: string; color: BadgeColor } {
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
      return "Top up an eligible balance, or allow more balances in the card’s funding.";
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
