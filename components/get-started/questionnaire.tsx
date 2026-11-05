"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormQuestions, answerError } from "@/components/onboarding/form-questions";
import { ForenButton } from "@/components/ui/foren-button";
import { bankingQuestionnaire, fusionQuestionnaire, unanswered, visible, type Answers, type Question, type QuestionGroup } from "@/domain/questionnaires";
import { useOnboarding, useRequirementContext } from "@/lib/onboarding-store";
import { cn } from "@/lib/utils";
import { Note, SetupColumn, SetupHeader } from "./shared";

/**
 * The onboarding questionnaire (domain/questionnaires.ts): business banking, Fusion API, or both.
 * One topic per step with a progress bar, then a review of every answer before submitting
 * (patterns from Mercury's and Airwallex's business onboarding). Answers save as you type.
 */
export function QuestionnairePage() {
  const ctx = useRequirementContext();
  const s = useOnboarding();
  const router = useRouter();

  if (!ctx || !s.signedUpAt)
    return (
      <SetupColumn size="md">
        <SetupHeader back="/get-started" title="Onboarding questionnaire" description="Finish sign-up first." />
      </SetupColumn>
    );

  const banking = ctx.entity !== "mto" && ctx.banking !== false;
  const api = !!ctx.api;
  const financialServices = ctx.entity === "mto" || s.profile?.sector === "Financial services";
  const groups = [...(banking ? bankingQuestionnaire(ctx.country) : []), ...(api ? fusionQuestionnaire(financialServices) : [])];

  return (
    <Steps
      groups={groups}
      answers={s.questionnaire}
      locked={s.questionnaireSubmitted}
      title={banking ? "Onboarding questionnaire" : "API onboarding"}
      onChange={(patch) => s.set({ questionnaire: { ...s.questionnaire, ...patch } })}
      onSubmit={() => {
        s.set({ questionnaireSubmitted: true });
        toast.success("Questionnaire submitted");
        router.push("/get-started");
      }}
    />
  );
}

function Steps({
  groups,
  answers,
  locked,
  title,
  onChange,
  onSubmit,
}: {
  groups: QuestionGroup[];
  answers: Answers;
  locked: boolean;
  title: string;
  onChange: (patch: Answers) => void;
  onSubmit: () => void;
}) {
  const shown = visible(groups, answers).filter((g) => g.questions.length);
  const review = shown.length; // the step after the last topic
  // Start on the first topic with unanswered questions (or the review when everything's done or submitted).
  const [step, setStep] = React.useState(() => {
    if (locked) return review;
    const first = shown.findIndex((g) => unanswered([g], answers).length > 0);
    return first === -1 ? review : first;
  });
  const [tried, setTried] = React.useState<Set<number>>(() => new Set());
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
    // Move focus to the new step's heading so screen readers announce it.
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const group = shown[step];
  const missing = group ? unanswered([group], answers) : [];
  const errorFor = (q: Question) => (tried.has(step) && missing.includes(q) ? answerError(q) : undefined);

  const next = () => {
    if (missing.length) {
      setTried((t) => new Set(t).add(step));
      document.getElementById(`q-${missing[0].id}`)?.focus();
      return;
    }
    go(step + 1);
  };

  const allMissing = unanswered(shown, answers);

  return (
    <SetupColumn size="md">
      <SetupHeader
        back="/get-started"
        title={title}
        description={locked ? "Submitted. You can’t change these answers while we review them." : "A few questions about how you’ll use your account. Your answers save as you go."}
      />

      {/* Progress: one segment per topic plus the review. */}
      <div className="mb-6 flex flex-col gap-2">
        <p aria-hidden className="text-[12px] leading-[18px] font-semibold tracking-[0.01em] text-fg-3 uppercase">
          Step {step + 1} of {review + 1}
        </p>
        <div
          className="flex gap-1"
          role="progressbar"
          aria-label="Questionnaire progress"
          aria-valuemin={1}
          aria-valuemax={review + 1}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${review + 1}`}
        >
          {[...shown, null].map((g, i) => (
            <span key={g?.key ?? "review"} className={cn("h-1 flex-1 rounded-full transition-colors", i < step ? "bg-[var(--color-foren-brand-green)]" : i === step ? "bg-fg" : "bg-line")} />
          ))}
        </div>
      </div>

      {step < review && group ? (
        <section aria-labelledby="q-step-title" className="flex flex-col gap-8 rounded-[20px] border-[0.7px] border-line bg-surface px-4 py-6">
          <div className="flex flex-col gap-1">
            <h2 id="q-step-title" ref={headingRef} tabIndex={-1} className="text-[16px] leading-[24px] font-semibold tracking-[0.015em] text-fg outline-none">
              {group.title}
            </h2>
            {group.intro && <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">{group.intro}</p>}
          </div>
          <FormQuestions questions={group.questions} answers={answers} onChange={onChange} errorFor={errorFor} />
        </section>
      ) : (
        <Review groups={shown} answers={answers} locked={locked} onEdit={go} headingRef={headingRef} />
      )}

      {step < review && tried.has(step) && missing.length > 0 && (
        <Note intent="error" className="mt-4">
          Answer the {missing.length === 1 ? "question" : `${missing.length} questions`} marked above to continue.
        </Note>
      )}

      {!locked && (
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <ForenButton variant="secondary" size="md" className="flex-1" onClick={() => go(step - 1)}>
              Back
            </ForenButton>
          )}
          {step < review ? (
            <ForenButton size="md" className="flex-1" onClick={next}>
              {step === review - 1 ? "Review answers" : "Continue"}
            </ForenButton>
          ) : (
            <ForenButton size="md" className="flex-1" disabled={allMissing.length > 0} onClick={onSubmit}>
              Submit answers
            </ForenButton>
          )}
        </div>
      )}
    </SetupColumn>
  );
}

/** Every answer, grouped by topic, with a way back to each topic (Mercury "Review your application"). */
function Review({
  groups,
  answers,
  locked,
  onEdit,
  headingRef,
}: {
  groups: QuestionGroup[];
  answers: Answers;
  locked: boolean;
  onEdit: (step: number) => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 ref={headingRef} tabIndex={-1} className="text-[16px] leading-[24px] font-semibold tracking-[0.015em] text-fg outline-none">
          Review your answers
        </h2>
        {!locked && <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">Check everything before you submit. You can’t change your answers while we review them.</p>}
      </div>
      {groups.map((g, i) => {
        const missing = unanswered([g], answers);
        return (
          <section key={g.key} aria-label={g.title} className="flex flex-col gap-4 rounded-[20px] border-[0.7px] border-line bg-surface px-4 py-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[16px] leading-[24px] font-semibold tracking-[0.015em] text-fg">{g.title}</h3>
              {!locked && (
                <button
                  type="button"
                  onClick={() => onEdit(i)}
                  className="text-[12px] font-medium text-fg underline underline-offset-2 outline-none hover:text-fg-2 focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Edit<span className="sr-only"> {g.title.toLowerCase()}</span>
                </button>
              )}
            </div>
            <dl className="flex flex-col gap-4">
              {g.questions.map((q) => (
                <div key={q.id} className="flex flex-col gap-1">
                  <dt className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">{q.label}</dt>
                  <dd className={cn("text-[14px] leading-[21px] font-medium break-words whitespace-pre-wrap", answers[q.id]?.trim() ? "text-fg" : missing.includes(q) ? "text-error" : "text-fg-3")}>
                    {answers[q.id]?.trim() ? answers[q.id].split(",").join(", ") : missing.includes(q) ? "Not answered yet" : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
