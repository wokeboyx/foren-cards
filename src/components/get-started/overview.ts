import {
  RiFileTextFill,
  RiQuestionAnswerFill,
  RiShieldCheckFill,
  RiUser3Fill,
} from "@/components/icons";
import type { Component } from "vue";
import { uploadRequirements } from "@/domain/onboarding";
import {
  contextOf,
  type ChecklistItem,
  type OnboardingState,
} from "@/stores/onboarding";
import { fullName } from "./shared";

export const TASK_ICON: Record<
  ChecklistItem["id"],
  { icon: Component; class: string }
> = {
  stakeholders: { icon: RiUser3Fill, class: "size-4 text-[#3d6fb6]" },
  verification: { icon: RiShieldCheckFill, class: "size-4 text-[#c026d3]" },
  documents: { icon: RiFileTextFill, class: "size-4 text-[#4c9a4e]" },
  questionnaire: { icon: RiQuestionAnswerFill, class: "size-4 text-[#b45309]" },
};

export const isDone = (i: ChecklistItem) =>
  i.status === "submitted" || i.status === "verified";

export function attentionNotes(
  item: ChecklistItem,
  s: OnboardingState,
): string[] {
  if (item.status !== "action_required") return [];
  if (item.id === "verification")
    return s.stakeholders
      .filter((p) => p.status === "action_required")
      .map(
        (p) => p.note ?? `${fullName(p)} needs to retake their verification.`,
      );
  if (item.id === "documents") {
    const ctx = contextOf(s);
    if (!ctx) return [];
    return uploadRequirements(ctx)
      .filter((r) => s.documents[r.id]?.status === "needs_attention")
      .map(
        (r) =>
          `${r.title}: ${s.documents[r.id]?.note ?? "Please upload it again."}`,
      );
  }
  return [];
}
