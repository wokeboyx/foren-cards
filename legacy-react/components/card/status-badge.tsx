import { RiCheckboxCircleFill, RiCloseCircleLine, RiLockLine, RiLockUnlockLine, RiSnowflakeLine, RiTimeLine } from "@remixicon/react";
import { ForenBadge } from "@/components/ui/foren-badge";
import { STATUS_LABEL } from "@/domain/labels";
import type { Card } from "@/domain/types";

/** Status is always icon + text, never colour alone (§4, §11). */
export function CardStatusBadge({ card, size = "md" }: { card: Pick<Card, "status" | "kind"> & Partial<Pick<Card, "adminLock" | "used">>; size?: "sm" | "md" | "lg" }) {
  const s = card.status;
  if (s === "frozen" && card.adminLock)
    return (
      <ForenBadge color="orange" size={size} leadingIcon={<RiLockLine aria-hidden />}>
        Locked by admin
      </ForenBadge>
    );
  if (s === "frozen")
    return (
      <ForenBadge color="indigo" size={size} leadingIcon={<RiSnowflakeLine aria-hidden />}>
        {STATUS_LABEL.frozen}
      </ForenBadge>
    );
  if (s === "canceled")
    return (
      <ForenBadge color="error" size={size} leadingIcon={<RiCloseCircleLine aria-hidden />}>
        {STATUS_LABEL.canceled}
      </ForenBadge>
    );
  if (card.kind === "emergency" && card.used)
    return (
      <ForenBadge color="gray" size={size} leadingIcon={<RiCheckboxCircleFill aria-hidden />}>
        Used
      </ForenBadge>
    );
  if (card.kind === "emergency")
    return (
      <ForenBadge color="orange" size={size} leadingIcon={<RiTimeLine aria-hidden />}>
        Emergency
      </ForenBadge>
    );
  return (
    <ForenBadge color="success" size={size} leadingIcon={<RiCheckboxCircleFill aria-hidden />}>
      {STATUS_LABEL.active}
    </ForenBadge>
  );
}

/** List status: Active / Frozen / Canceled (AC 1.2). Merchant locks are shown separately by MerchantLockBadge. */
export function listStatus(card: Pick<Card, "status" | "kind">): "active" | "frozen" | "canceled" {
  return card.status;
}

/** "Locked · Figma" for one-merchant cards, or "Locks on first use" while it's waiting for its first charge. */
export function MerchantLockBadge({ card, merchantName, size = "sm" }: { card: Pick<Card, "lockedMerchantId" | "permissions">; merchantName?: string; size?: "sm" | "md" }) {
  if (card.lockedMerchantId)
    return (
      <ForenBadge color="gray" size={size} leadingIcon={<RiLockLine aria-hidden />}>
        {merchantName ?? "One merchant"}
      </ForenBadge>
    );
  if (card.permissions.mode === "first_merchant")
    return (
      <ForenBadge color="primary" size={size} leadingIcon={<RiLockUnlockLine aria-hidden />}>
        Locks on first use
      </ForenBadge>
    );
  return null;
}

/** Text for the card art when a one-merchant card hasn't been charged yet. */
export const lockText = (card: Pick<Card, "lockedMerchantId" | "permissions">) =>
  !card.lockedMerchantId && card.permissions.mode === "first_merchant" ? "Locks to its first merchant" : undefined;
