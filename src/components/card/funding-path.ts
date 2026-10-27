import { CATEGORY_LABEL } from "@/domain/labels";
import type { Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";

export function permissionSentence(card: Pick<Card, "permissions" | "lockedMerchantId">): string {
  const p = card.permissions;
  if (card.lockedMerchantId) return `Only works at ${merchantById(card.lockedMerchantId)?.name}.`;
  if (p.mode === "anywhere") return "Works anywhere, except blocked categories and merchants.";
  if (p.mode === "first_merchant") return "Locks to the first merchant that charges it. Best for one subscription or sign-up.";
  if (p.mode === "merchants")
    return p.allowedMerchantIds.length
      ? `Only works at ${p.allowedMerchantIds.length} selected ${p.allowedMerchantIds.length === 1 ? "merchant" : "merchants"}.`
      : "Only works at selected merchants — none selected yet.";
  return p.allowedCategories.length
    ? `Only works in ${p.allowedCategories.map((c) => CATEGORY_LABEL[c]).join(", ")}.`
    : "Only works in allowed categories — none selected yet.";
}
