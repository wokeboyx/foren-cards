"use client";
import { useSignupGuard } from "./guard";
import * as React from "react";
import { useRouter } from "next/navigation";
import { MTO_QUESTIONNAIRE, unanswered, visible, type Answers } from "@/domain/questionnaires";
import { useOnboarding } from "@/lib/onboarding-store";
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
      <nav aria-label="Questionnaire sections" className="mb-6">
        <ol className="grid grid-cols-3 gap-2">
          {TABS.map((t, i) => {
            const reachable = i <= index || TABS.slice(0, i).every((x) => valid(x.key));
            return (
              <li key={t.key}>
                <button
                  type="button"
                  disabled={!reachable}
                  aria-current={t.key === tab ? "step" : undefined}
                  onClick={() => go(t.key)}
                  className="flex w-full flex-col gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
                >
                  <span className={cn("h-[3px] w-full rounded-full", i <= index ? "bg-fg" : "bg-line-2")} aria-hidden />
                  <span className={cn("text-[12px] leading-[18px] font-medium sm:text-[13px]", t.key === tab ? "text-fg" : i < index ? "text-fg-2" : "text-fg-3")}>{t.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <FormCard>
        <h2 ref={headingRef} tabIndex={-1} className="text-[16px] leading-6 font-semibold text-fg outline-none">
          {current.title}
        </h2>
        <FormQuestions questions={current.questions} answers={a} onChange={(patch) => setA((p) => ({ ...p, ...patch }))} errorFor={() => undefined} />
      </FormCard>
    </OnboardingFrame>
  );
}
