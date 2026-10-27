import { nationalityOptions } from "@/domain/onboarding";
import { effectiveOwnership, type Stakeholder } from "@/stores/onboarding";

export type Editing = { kind: "person" | "company"; person: Stakeholder | null; parent: Stakeholder | null };

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NATIONALITIES = nationalityOptions();

/** ISO date 18 years ago today: anyone born after it is under 18. */
export function adultCutoff() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

/** What's still missing on a row, if anything. */
export function missingOf(p: Stakeholder, all: Stakeholder[], threshold: number): string | null {
  if ((p.shareholder || p.kind === "company" || p.parentId) && !p.ownership) return "Ownership percentage missing.";
  if (p.kind === "company") return null;
  if (!p.dob || !p.nationality) return "Date of birth and nationality missing.";
  if ((effectiveOwnership(p, all) >= threshold || p.controller) && !p.control.length) return "Nature of control missing.";
  return null;
}
