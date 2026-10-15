// Single source of truth for prototype copy — Foren Cards UX doc §8 (content patterns)
// and §9 (decline reasons). Keep the same label and sentence wherever the same state appears.
import type { DeclineReason } from "@/domain/types";

export const COPY = {
  cardsEmpty: {
    title: "Issue your first card",
    body: "Create a virtual card for your team and control where it can be used.",
    value: "Spend from your Foren Global account with virtual cards.",
  },
  createCard: "Create card",
  subscriptionsEmpty: {
    title: "No subscriptions yet",
    body: "Recurring payments we identify on your cards will appear here, with their expected dates and amounts when available.",
  },
  transactionsEmpty: {
    title: "No transactions yet",
    body: "Card payments will appear here after the first transaction.",
  },
  autoFxEmpty: {
    title: "Set your first currency goal",
    body: "Tell Foren how you want to manage a currency balance, and review each goal before it acts.",
  },
  merchantUnknown: "No history yet",
  estimatedNextCharge: "Estimated next charge",
  insufficientHistory: "We need one more charge to estimate the next payment.",
  blockMerchantConfirm:
    "Future charges from this merchant on this card will be declined. Other merchants are unaffected. This does not cancel your subscription with the merchant.",
  cardFrozen: "This card is frozen. New charges and subscriptions on it will fail.",
  approvalWindow: "Approved for one charge. Retry within 15 minutes.",
  loading: "Loading…",
  genericError: "We couldn’t load this information. Try again.",
  saveFailure: "We couldn’t save your changes. Your previous settings are unchanged. Try again.",
  successTitle: "Card created",
  successBody: "Your card is ready. Review its details and share them only with the intended cardholder.",
  simulationLabel: "Simulation — no real payment was made.",
  stillOnOldCard: "Still on the old card",
} as const;

export const DECLINE: Record<DeclineReason, { title: string; next: string; fixable: boolean }> = {
  frozen: { title: "This card is frozen.", next: "Ask the owner to unfreeze it.", fixable: true },
  canceled: { title: "This card has been canceled.", next: "Use another card.", fixable: false },
  merchant_blocked: {
    title: "This merchant is blocked on this card.",
    next: "Ask the owner to allow this charge if it is legitimate.",
    fixable: true,
  },
  category_blocked: {
    title: "Payments in this category are blocked on this card.",
    next: "Ask the owner to review the card’s category permissions.",
    fixable: true,
  },
  card_control: {
    title: "This kind of payment is turned off in Card controls.",
    next: "Turn it back on in Card controls, then try again.",
    fixable: true,
  },
  merchant_not_allowed: {
    title: "This card only works at approved merchants.",
    next: "Ask the owner to approve this merchant.",
    fixable: true,
  },
  per_charge_limit: {
    title: "This payment is above the most this card can spend in one charge.",
    next: "Ask the owner to review the per-charge limit.",
    fixable: true,
  },
  spend_limit: {
    title: "This card has reached its limit for this period.",
    next: "Ask the owner to review the card’s spending limit.",
    fixable: true,
  },
  insufficient_balance: {
    title: "None of the eligible balances could cover this payment.",
    next: "Check available balances or use an approved alternative.",
    fixable: true,
  },
  // Not in the §9 inventory — added for prototype state coverage; confirm with content design.
  expired: { title: "This card has expired.", next: "Use another card.", fixable: false },
  outside_period: { title: "This card only works on certain dates.", next: "Ask the owner to change the card’s spending period.", fixable: true },
  unknown: {
    title: "We couldn’t complete this payment.",
    next: "Try another payment method or contact support if the problem continues.",
    fixable: false,
  },
};
