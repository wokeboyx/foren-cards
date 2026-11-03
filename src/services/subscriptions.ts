// Subscriptions (recurring merchants). Mock-backed; see ./README.md.
import * as mock from "./mock/backend";

export const setReminders = (
  subId: string,
  reminders: { owner: boolean; cardholder: boolean; daysBefore: number },
): Promise<void> => mock.setReminders(subId, reminders);
/** Mock-only stand-in for the merchant confirming new billing details. */
export const confirmBillingMoved = (subId: string): Promise<void> =>
  mock.confirmBillingMoved(subId);
