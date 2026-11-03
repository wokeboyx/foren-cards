// Cards service. Every function here is one call the UI makes. They currently run on the mock
// backend; replace each body with an `http()` call (see ./README.md) and update the app store
// from the response. Keep the signatures: components depend on them.
import type { Card, Currency, Money } from "@/domain/types";
import * as mock from "./mock/backend";

export { DEFAULT_CONTROLS, newCardDraft, randomLast4 } from "./mock/backend";

/** Freeze a card. Server records "Status changed … to Frozen" in the card history. */
export const freezeCard = (id: string): Promise<void> => mock.freezeCard(id);
/** Unfreeze (owner) a frozen card. */
export const unfreezeCard = (id: string): Promise<void> =>
  mock.unfreezeCard(id);
/** Cancel permanently. Pending requests on the card are denied. */
export const cancelCard = (id: string): Promise<void> => mock.cancelCard(id);
/** Move to the Archived tab. */
export const archiveCard = (id: string): Promise<void> => mock.archiveCard(id);
export const renameCard = (id: string, nickname: string): Promise<void> =>
  mock.renameCard(id, nickname);
/** Change the spending limit; with `until` (ISO) the previous limit comes back at that time. */
export const setCardLimit = (
  id: string,
  limit: Card["limit"],
  until?: string,
): Promise<void> => mock.setCardLimit(id, limit, until);
/** Mock-only: restores temporary limits whose period ended (the server does this on its own). */
export const restoreExpiredLimits = (at: Date): void =>
  mock.restoreExpiredLimits(at);
/** Save full card settings from the edit flow. */
export const saveCard = (card: Card): Promise<void> => mock.saveCard(card);
/** Issue one card. Resolves to the created card. */
export const issueCard = (card: Card): Promise<Card> => mock.issueCard(card);
/** Issue several cards with the same settings (bulk create). New cards start with no balance; fund them with `fundCard`. */
export const issueCards = (
  cards: Card[],
  feeFrom?: Currency,
): Promise<Card[]> => mock.issueCards(cards, feeFrom);
/** Top a card up: `amount` (in the card's currency) is taken from the account balance in `from`, plus any FX fee. */
export const fundCard = (
  id: string,
  from: Currency,
  amount: Money,
): Promise<Card> => mock.fundCard(id, from, amount);
/** Give a merchant its own card copied from `sourceCardId`; optionally block it on the old card once it switches. */
export const giveMerchantOwnCard = (
  sourceCardId: string,
  merchantId: string,
  blockOld: boolean,
): Promise<Card> =>
  mock.giveMerchantOwnCard(sourceCardId, merchantId, blockOld);
/** Cancel this card and issue a new number with the same settings. */
export const replaceCard = (id: string): Promise<Card> => mock.replaceCard(id);
/** Change nickname, design, card controls or limit. */
export const updateCard = (
  id: string,
  patch: Partial<Pick<Card, "nickname" | "design" | "controls" | "limit">>,
): Promise<void> => mock.updateCard(id, patch);
/** Admin lock: like a freeze, but only an admin can unlock it. */
/** The card only works between these ISO dates. Clear both to remove. */
export const setSpendingPeriod = (
  id: string,
  activeFrom?: string,
  activeUntil?: string,
): Promise<void> => mock.setSpendingPeriod(id, activeFrom, activeUntil);
/** Save an unfinished create-card flow. */
