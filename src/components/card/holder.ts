import type { Card } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { personById } from "@/stores/app";

/** Name printed on the card: the company for company cards, otherwise the cardholder. */
export function nameOnCard(
  card: Pick<Card, "holderId" | "companyCard">,
): string | undefined {
  return card.companyCard ? COMPANY.name : personById(card.holderId)?.name;
}

/** Who uses the card, for lists and summaries. A card belongs to exactly one person. */
export function usedBy(card: Pick<Card, "holderId">): string {
  return personById(card.holderId)?.name ?? "—";
}
