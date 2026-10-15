// Role-based capabilities for the prototype. Final rules are open questions (§12).
import { POLICY } from "@/config/policy";
import type { Card, Role } from "@/domain/types";
import { currentUserId } from "./store";

export type Capability =
  | "issue"
  | "edit"
  | "freeze"
  | "unfreeze"
  | "cancel"
  | "archive"
  | "viewDetails"
  | "approve"
  | "manageSubscriptions"
  | "reminders"
  | "autofx";

export function can(role: Role, cap: Capability, card?: Card): boolean {
  const me = currentUserId(role);
  const own = card ? card.holderId === me || !!card.contactIds?.includes(me) : false;
  switch (cap) {
    case "issue":
    case "edit":
    case "cancel":
    case "archive":
    case "unfreeze":
    case "manageSubscriptions":
      return role === "owner" || (role === "individual" && own);
    case "freeze":
      return role === "owner" || own;
    case "viewDetails":
      return POLICY.fullPanRoles.includes(role) && (role === "owner" || own);
    case "approve":
      return POLICY.approverRoles.includes(role);
    case "reminders":
      return role === "owner" || role === "finance" || own;
    case "autofx":
      return role === "owner" || role === "finance";
  }
}

/** Cards visible to the current role in the business experience. */
export function visibleCards(role: Role, cards: Card[]): Card[] {
  const biz = cards.filter((c) => !c.personal);
  const me = currentUserId(role);
  if (role === "cardholder") return biz.filter((c) => c.holderId === me || c.contactIds?.includes(me));
  return biz;
}
