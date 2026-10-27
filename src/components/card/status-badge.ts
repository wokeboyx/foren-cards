import type { Card } from "@/domain/types";

/** List status: Active / Frozen / Canceled (AC 1.2). Merchant locks are shown separately by MerchantLockBadge. */
export function listStatus(card: Pick<Card, "status" | "kind">): "active" | "frozen" | "canceled" {
  return card.status;
}

/** Text for the card art when a one-merchant card hasn't been charged yet. */
export const lockText = (card: Pick<Card, "lockedMerchantId" | "permissions">) =>
  !card.lockedMerchantId && card.permissions.mode === "first_merchant" ? "Locks to its first merchant" : undefined;
