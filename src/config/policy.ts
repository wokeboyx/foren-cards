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
  /** Max single limit value accepted in the form, per currency (validation range). */
  maxLimitMajor: { USD: 1_000_000, GBP: 1_000_000, EUR: 1_000_000, CAD: 1_000_000, NGN: 1_500_000_000 } as Record<Currency, number>,
};
