import type { Component } from "vue";
import { RiCheckboxCircleFill, RiCloseCircleFill, RiQuestionFill, RiSettings3Fill } from "@/components/icons";
import type { CompatResult, Verdict } from "@/domain/compatibility";

export const VERDICT_STYLE: Record<Verdict, { icon: Component; cls: string }> = {
  works: { icon: RiCheckboxCircleFill, cls: "bg-success-subtle text-success" },
  likely: { icon: RiCheckboxCircleFill, cls: "bg-info-subtle text-info" },
  setup_needed: { icon: RiSettings3Fill, cls: "bg-warning-subtle text-warning" },
  wont_work: { icon: RiCloseCircleFill, cls: "bg-error-subtle text-error" },
  no_history: { icon: RiQuestionFill, cls: "bg-subtle text-fg-2" },
};

/** The rule change that would let a blocked merchant through (e.g. allow this merchant). */
export type CompatFix = NonNullable<Extract<CompatResult["card"], { ok: false }>["fix"]>;
