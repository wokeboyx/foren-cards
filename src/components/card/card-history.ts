import type { Card, CardEvent } from "@/domain/types";

/** Card's audit log, newest first. Cards from before logging still show when they were created. */
export function cardEvents(card: Card): CardEvent[] {
  const list = card.history ?? [];
  return list.some((e) => e.text.startsWith("Card created")) ? list : [...list, { at: card.createdAt, text: "Card created", by: "System" }];
}
