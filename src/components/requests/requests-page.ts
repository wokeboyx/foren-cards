import type { BadgeColor } from "@/components/ui/foren-badge";
import { PERIOD_PHRASE } from "@/domain/labels";
import { format } from "@/domain/money";
import type { Card, CardRequest } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";

export const KIND_LABEL: Record<CardRequest["kind"], string> = {
  one_time_approval: "One-time approval",
  unfreeze: "Unfreeze card",
  emergency_card: "Emergency card",
  new_card: "New card",
  limit_increase: "Limit increase",
};

export const STATE: Record<CardRequest["state"], { label: string; color: BadgeColor }> = {
  pending: { label: "Waiting for decision", color: "orange" },
  approved: { label: "Approved", color: "success" },
  denied: { label: "Declined", color: "error" },
  expired: { label: "Expired", color: "gray" },
  used: { label: "Used", color: "gray" },
};

export function requestTitle(r: CardRequest, card?: Card) {
  if (r.kind === "unfreeze") return `Unfreeze ${card?.nickname ?? "card"} •• ${card?.last4 ?? ""}`;
  if (r.kind === "limit_increase") return `${card?.nickname ?? "Card"} · up to ${format(r.newLimit!.amount)} ${PERIOD_PHRASE[r.newLimit!.period]}`;
  if (r.kind === "new_card") return `${r.newCard!.nickname} · up to ${format(r.newCard!.limit.amount)} ${PERIOD_PHRASE[r.newCard!.limit.period]}`;
  return `${format(r.amount!)} at ${merchantById(r.merchantId!)?.name}`;
}
