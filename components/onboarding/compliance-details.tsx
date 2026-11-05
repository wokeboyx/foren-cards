"use client";
import { useSignupGuard } from "./guard";
import * as React from "react";
import { useRouter } from "next/navigation";
import { MTO_QUESTIONNAIRE, unanswered, visible, type Answers } from "@/domain/questionnaires";
import { useOnboarding } from "@/lib/onboarding-store";
import { CheckBoldIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { FormCard, OnboardingFrame } from "./frame";
import { FormQuestions } from "./form-questions";

/**
 * Step 5, MTOs and PSPs only: "Regulatory & Compliance Details" (Figma 3035:75359–75690). The questions are
 * the "Client Onboarding Questionnaire MTO" Google Form, split into three tabs.
 */

const TABS = MTO_QUESTIONNAIRE;
type TabKey = string;

/** Earlier versions stored lists; keep only text answers. */
function toAnswers(edd: Record<string, string | string[]>): Answers {
  return Object.fromEntries(Object.entries(edd).filter((e): e is [string, string] => typeof e[1] === "string"));
}

export function ComplianceDetails() {
  const ready = useSignupGuard("/onboarding/compliance");
  const router = useRouter();
  const entity = useOnboarding((s) => s.entity);
  const saved = useOnboarding((s) => s.edd);
  const set = useOnboarding((s) => s.set);
  const [tab, setTab] = React.useState<TabKey>(TABS[0].key);
  const [a, setA] = React.useState<Answers>(() => toAnswers(saved));
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    if (ready && entity && entity !== "mto") router.replace("/onboarding/review");
  }, [ready, entity, router]);

  if (!ready || entity !== "mto") return null;

  const valid = (key: TabKey) => unanswered(TABS.filter((t) => t.key === key), a).length === 0;
  const index = TABS.findIndex((t) => t.key === tab);
  const current = visible([TABS[index]], a)[0];

  const go = (next: TabKey) => {
    set({ edd: a });
    setTab(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  return (
    <OnboardingFrame
      step="edd"
      back={index === 0 ? "/onboarding/business/profile" : () => go(TABS[index - 1].key)}
      title="Regulatory & Compliance Details"
      description="Tell us about your business activity, fund flow and AML controls to complete your business risk assessment."
      footer={{
        primary: {
          label: index === TABS.length - 1 ? "Continue to review" : "Continue",
          disabled: !valid(tab),
          onClick: () => {
            if (index < TABS.length - 1) return go(TABS[index + 1].key);
            set({ edd: a, edd_done: true });
            router.push("/onboarding/review");
          },
        },
      }}
    >
      <SectionStepper
        sections={TABS.map((t, i) => {
          const shown = visible([t], a)[0].questions;
          const required = shown.filter((q) => !q.optional);
          const answered = required.filter((q) => a[q.id]?.trim()).length;
          return {
            key: t.key,
            title: t.title,
            done: i !== index && valid(t.key),
            answered,
            total: required.length,
            reachable: i <= index || TABS.slice(0, i).every((x) => valid(x.key)),
          };
        })}
        current={index}
        onSelect={(i) => go(TABS[i].key)}
      />

      <FormCard>
        <h2 ref={headingRef} tabIndex={-1} className="text-[16px] leading-6 font-semibold text-fg outline-none">
          {current.title}
        </h2>
        <FormQuestions questions={current.questions} answers={a} onChange={(patch) => setA((p) => ({ ...p, ...patch }))} errorFor={() => undefined} />
      </FormCard>
    </OnboardingFrame>
  );
}

type Section = { key: string; title: string; done: boolean; answered: number; total: number; reachable: boolean };

/**
 * Section progress for the questionnaire: numbered steps joined by a line, in the sidebar's visual language
 * (green tick done, dark current, outlined upcoming), with each section's status underneath.
 * Finished and current sections are clickable; later ones unlock as the earlier ones are completed.
 */
function SectionStepper({ sections, current, onSelect }: { sections: Section[]; current: number; onSelect: (i: number) => void }) {
  return (
    <nav aria-label="Questionnaire sections" className="mb-6 rounded-[20px] bg-surface px-4 py-4">
      <p className="mb-3 text-[12px] leading-[18px] font-semibold tracking-[0.01em] text-fg-3 uppercase">
        Section {current + 1} of {sections.length}
      </p>
      <ol className="flex items-start">
        {sections.map((s, i) => {
          const active = i === current;
          const status = s.done ? "Done" : active ? `${s.answered} of ${s.total} answered` : "Up next";
          return (
            <li key={s.key} className="relative flex min-w-0 flex-1 flex-col">
              {/* Connector to the next step, drawn from this circle's centre. */}
              {i < sections.length - 1 && (
                <span aria-hidden className={cn("absolute top-3 right-0 left-6 h-0.5 rounded-full sm:left-7", s.done ? "bg-[var(--color-foren-brand-green)]" : "bg-line")} />
              )}
              <button
                type="button"
                disabled={!s.reachable}
                aria-current={active ? "step" : undefined}
                aria-label={`${s.title}: ${status}`}
                onClick={() => onSelect(i)}
                className="group relative flex min-w-0 flex-col items-start gap-2 pr-3 text-left outline-none disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    "relative z-[1] grid size-6 shrink-0 place-items-center rounded-full text-[12px] leading-4 font-bold ring-4 ring-surface transition-colors group-focus-visible:shadow-[0_0_0_2px_var(--color-foren-bg-default),0_0_0_4px_var(--color-foren-border-focused-primary)]",
                    s.done
                      ? "bg-[var(--color-foren-brand-green)] text-white"
                      : active
                        ? "bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]"
                        : "border-[1.5px] border-line-2 bg-surface text-fg-2"
                  )}
                  aria-hidden
                >
                  {s.done ? <CheckBoldIcon className="size-[14px]" /> : i + 1}
                </span>
                <span className={cn("flex min-w-0 flex-col gap-0.5", !active && "max-sm:hidden")}>
                  <span className={cn("text-[13px] leading-[18px] font-medium tracking-[0.01em]", active ? "text-fg" : s.done ? "text-success" : "text-fg-2", s.reachable && !active && "group-hover:underline")}>
                    {s.title}
                  </span>
                  <span className={cn("text-[12px] leading-[16px] font-medium tracking-[0.01em]", active ? "text-fg-2" : "text-fg-3")}>{status}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
