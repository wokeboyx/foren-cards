import type { BadgeColor } from "@/components/ui/foren-badge";
import type { Stakeholder, TaskStatus } from "@/stores/onboarding";

export const TASK_BADGE: Record<TaskStatus, [BadgeColor, string]> = {
  not_started: ["gray", "Not started"],
  in_progress: ["orange", "In progress"],
  submitted: ["success", "Submitted"],
  action_required: ["error", "Action required"],
  verified: ["success", "Verified"],
};

export const fullName = (p: Pick<Stakeholder, "firstName" | "lastName">) => `${p.firstName} ${p.lastName}`.trim();

/** "Director & shareholder · 25% ownership" */
export function roleLine(p: Stakeholder) {
  const roles = [
    p.director && "Director",
    p.shareholder && "shareholder",
    !p.director && !p.shareholder && p.signatory && "Authorised signatory",
    !p.director && !p.shareholder && !p.signatory && p.controller && "Significant control",
  ].filter(Boolean) as string[];
  let text = roles.join(" & ");
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (!text) text = p.position || "Stakeholder";
  if (p.shareholder && p.ownership > 0) text += ` · ${p.ownership}% ownership`;
  if ((p.director || p.shareholder) && p.signatory) text += " · Signatory";
  return text;
}

/** Fake but stable per-person verification link (prototype). */
export const verificationLink = (p: Stakeholder) => `https://verify.foren.co/k/${p.id.replace(/^sh_/, "")}-${p.firstName.toLowerCase()}`;
