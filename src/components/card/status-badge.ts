import type { Card } from "@/domain/types";

/** List status: Active / Frozen / Canceled (AC 1.2). */
export function listStatus(
  card: Pick<Card, "status" | "kind">,
): "active" | "frozen" | "canceled" {
  return card.status;
}
