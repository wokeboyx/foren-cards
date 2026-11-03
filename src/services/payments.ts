// Transactions, merchants and balances. Mock-backed; see ./README.md.
import type { Money, Transaction } from "@/domain/types";
import * as mock from "./mock/backend";

/** Note, expense category or receipt on a transaction. */
export const updateTransaction = (
  id: string,
  patch: Partial<Pick<Transaction, "note" | "expenseCategory" | "receipt">>,
): Promise<void> => mock.updateTransaction(id, patch);
/** Block future charges from a merchant on one card (does not cancel the subscription contract). */
/** Keep the block but let the merchant's next attempt through once. */
export const allowNextAttempt = (subscriptionId: string): Promise<void> =>
  mock.allowNextAttempt(subscriptionId);
export const topUpBalance = (
  currency: Money["currency"],
  minor: number,
): Promise<void> => mock.topUpBalance(currency, minor);

// Simulations: there is no real equivalent; these exist so testers can produce charges.
/** Simulated charge attempt, run through the authorisation engine. */
export const attemptPayment = mock.attemptPayment;
export const simulatePersonalPurchase = mock.simulatePersonalPurchase;
export const demoMerchantsSwitch = mock.demoMerchantsSwitch;
