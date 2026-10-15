import type { Card } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { personById } from "@/lib/store";

/** Name printed on the card: the company for company cards, otherwise the cardholder. */
export function nameOnCard(card: Pick<Card, "holderId" | "companyCard">): string | undefined {
  return card.companyCard ? COMPANY.name : personById(card.holderId)?.name;
}

/** Who uses the card, for lists and summaries, e.g. "Company card · Amara Okafor +1". */
export function usedBy(card: Pick<Card, "holderId" | "companyCard" | "contactIds">): string {
  if (!card.companyCard) return personById(card.holderId)?.name ?? "—";
  const ids = card.contactIds ?? [card.holderId];
  const first = personById(ids[0])?.name;
  return first ? `${first}${ids.length > 1 ? ` +${ids.length - 1}` : ""}` : "No one yet";
}
