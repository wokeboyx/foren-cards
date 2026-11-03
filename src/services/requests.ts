// Card requests (cardholder asks, owner decides). Mock-backed; see ./README.md.
import type { Card, CardRequest, DeclineReason, Money } from "@/domain/types";
import * as mock from "./mock/backend";

export const requestUnfreeze = (
  cardId: string,
  note?: string,
  attemptTxId?: string,
): Promise<CardRequest> => mock.requestUnfreeze(cardId, note, attemptTxId);
export const requestNewCard = (input: {
  nickname: string;
  limit: Card["limit"];
  oneMerchant: boolean;
  design: Card["design"];
  note?: string;
}): Promise<CardRequest> => mock.requestNewCard(input);
export const requestLimitIncrease = (
  cardId: string,
  newLimit: Card["limit"],
  note?: string,
): Promise<CardRequest> => mock.requestLimitIncrease(cardId, newLimit, note);
/** Cardholder asks the account owner to add money to a card. `amount` is in the card's currency. */
export const requestTopup = (
  cardId: string,
  amount: Money,
  note?: string,
): Promise<CardRequest> => mock.requestTopup(cardId, amount, note);
/** One-time approval for a declined charge. */
export const requestApproval = (input: {
  cardId: string;
  merchantId: string;
  amount: Money;
  reason: DeclineReason;
  note?: string;
  attemptTxId?: string;
}): Promise<CardRequest> => mock.requestApproval(input);
/** Single-use card locked to one merchant. */
export const requestEmergencyCard = (input: {
  merchantId: string;
  amount: Money;
  note: string;
  cardId?: string;
  attemptTxId?: string;
}): Promise<CardRequest> => mock.requestEmergencyCard(input);
/** Approve or deny any request. The UI asks for the transaction PIN first. */
export const decideRequest = (
  id: string,
  approve: boolean,
  denyNote?: string,
): Promise<void> => mock.decideRequest(id, approve, denyNote);
