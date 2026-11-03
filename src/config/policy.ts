// Product decisions that are still open in the UX doc (§12). Each value is a prototype
// assumption — change it here, never hard-code it in a component.
import type { Currency, Money, Role } from "@/domain/types";

export const POLICY = {
  /** §12 "Who can view full card numbers?" — cardholders only see their own cards. */
  fullPanRoles: ["owner", "cardholder"] as Role[],
  /** §12 "Who can approve cardholder requests besides the account owner?" */
  approverRoles: ["owner"] as Role[],
  /** §12 "Production emergency-card ceiling" — the PRD prototype says $10,000, but it is unconfirmed. null hides it. */
  emergencyCeiling: null as Money | null,
  /** §5.4 — emergency card validity, subject to final policy. */
  emergencyValidityMinutes: 30,
  /** §5.2 — one-time approval retry window. */
  approvalWindowMinutes: 15,
  /** §12 "How much history is required to forecast a subscription?" */
  forecastMinCharges: 2,
  /** §12 "Which currencies are supported at launch?" */
  launchCurrencies: ["USD", "GBP", "EUR", "NGN", "CAD"] as Currency[],
  /** §12 "Can a merchant be blocked across all cards at once?" — not in V1 prototype. */
  canBlockMerchantAcrossCards: false,
  /** Personal track: highest monthly spending limit an individual can set (prototype assumption). */
  personalMonthlyMaxNGN: 5_000_000,
  /** Flat fee charged each time a card is created. */
  cardCreationFee: { minor: 200, currency: "USD" } as Money,
  /** Fee for putting money on a card: a share of the amount, capped. Prototype assumption: 1%, capped at $100. */
  cardFundingFee: {
    bps: 100,
    cap: { minor: 10_000, currency: "USD" } as Money,
  },
  /** Fee for taking money off a card back to a balance. Prototype assumption: the same schedule as funding. */
  cardWithdrawalFee: {
    bps: 100,
    cap: { minor: 10_000, currency: "USD" } as Money,
  },
  /** Cards expire this many months after they're created. */
  cardExpiryMonths: 12,
  /** The most active (not cancelled) cards an account can have at once. */
  maxActiveCards: 15,
  /** A card shows "Expiring soon" this many days before it expires. */
  expiringSoonDays: 45,
  /** Limits a new card starts with, until the customer changes them. */
  defaultLimit: {
    daily: { minor: 100_000, currency: "USD" },
    txn: { minor: 50_000, currency: "USD" },
  } as { daily: Money; txn: Money },
  /** Max single limit value accepted in the form, per currency (validation range). */
  maxLimitMajor: {
    USD: 1_000_000,
    GBP: 1_000_000,
    EUR: 1_000_000,
    CAD: 1_000_000,
    NGN: 1_500_000_000,
  } as Record<Currency, number>,
};
