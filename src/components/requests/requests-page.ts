import type { BadgeColor } from "@/components/ui/foren-badge";
import { limitSummary } from "@/domain/limits";
import { format } from "@/domain/money";
import type { Card, CardRequest } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";

export const KIND_LABEL: Record<CardRequest["kind"], string> = {
  one_time_approval: "One-time approval",
  unfreeze: "Unfreeze card",
  emergency_card: "Emergency card",
  new_card: "New card",
  limit_increase: "Limit increase",
  topup: "Top-up",
};

export const STATE: Record<
  CardRequest["state"],
  { label: string; color: BadgeColor }
> = {
  pending: { label: "Waiting for decision", color: "orange" },
  approved: { label: "Approved", color: "success" },
  denied: { label: "Declined", color: "error" },
  expired: { label: "Expired", color: "gray" },
  used: { label: "Used", color: "gray" },
};

export function requestTitle(r: CardRequest, card?: Card) {
  if (r.kind === "unfreeze")
    return `Unfreeze ${card?.nickname ?? "card"} •• ${card?.last4 ?? ""}`;
  if (r.kind === "limit_increase")
    return `${card?.nickname ?? "Card"} · ${limitSummary(r.newLimit!)}`;
  if (r.kind === "topup")
    return `${format(r.amount!)} for ${card?.nickname ?? "card"}`;
  if (r.kind === "new_card")
    return `${r.newCard!.nickname} · ${limitSummary(r.newCard!.limit)}`;
  return `${format(r.amount!)} at ${merchantById(r.merchantId!)?.name}`;
}
