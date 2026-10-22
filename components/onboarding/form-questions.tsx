"use client";
import { Field, fieldCls } from "@/components/onboarding/frame";
import { ForenCheckbox } from "@/components/ui/foren-checkbox";
import { ForenRadio, ForenRadioGroup } from "@/components/ui/foren-radio";
import type { Answers, Question } from "@/domain/questionnaires";
import { cn } from "@/lib/utils";

const textareaCls =
  "min-h-[96px] w-full resize-y rounded-[16px] border border-line bg-subtle p-3 text-[14px] leading-[21px] font-medium text-fg outline-none placeholder:text-fg-3 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus/20";

/** Renders questions from domain/questionnaires.ts. Each field's id is `q-<question id>`, for focusing the first error. */
export function FormQuestions({
  questions,
  answers,
  onChange,
  errorFor,
}: {
  questions: Question[];
  answers: Answers;
  onChange: (patch: Answers) => void;
  errorFor: (q: Question) => string | undefined;
}) {
  return (
    <>
      {questions.map((q) => {
        const id = `q-${q.id}`;
        const value = answers[q.id] ?? "";
        const error = errorFor(q);
        const label = q.optional ? `${q.label} (optional)` : q.label;

        if (q.type === "choice" || q.type === "multi")
          return (
            <fieldset key={q.id} className="flex flex-col gap-2" aria-invalid={!!error}>
              <legend className="text-[14px] leading-[21px] font-medium text-fg">{label}</legend>
              {q.description && <p className="-mt-1 text-[12px] leading-[18px] font-medium text-fg-2">{q.description}</p>}
              {q.type === "choice" ? (
                <ForenRadioGroup value={value} onChange={(v) => onChange({ [q.id]: v })} className={cn("mt-1", (q.options?.length ?? 0) <= 2 && "flex-row gap-6")} ariaLabel={q.label}>
                  {q.options?.map((o, i) => <ForenRadio key={o} id={i === 0 ? id : undefined} value={o} label={o} />)}
                </ForenRadioGroup>
              ) : (
                <div className="mt-1 flex flex-wrap gap-x-5 gap-y-3">
                  {q.options?.map((o, i) => {
                    const list = value ? value.split(",") : [];
                    const toggle = () => onChange({ [q.id]: (list.includes(o) ? list.filter((x) => x !== o) : [...list, o]).join(",") });
                    return <ForenCheckbox key={o} id={i === 0 ? id : undefined} checked={list.includes(o)} onCheckedChange={toggle} label={o} />;
                  })}
                </div>
              )}
              {error && (
                <p role="alert" className="text-[12px] leading-[18px] font-medium text-error">
                  {error}
                </p>
              )}
            </fieldset>
          );

        return (
          <Field key={q.id} label={label} description={q.description} htmlFor={id} error={error}>
            {q.type === "long" ? (
              <textarea id={id} className={textareaCls} value={value} aria-invalid={!!error} onChange={(e) => onChange({ [q.id]: e.target.value })} />
            ) : (
              <input id={id} className={fieldCls} value={value} aria-invalid={!!error} onChange={(e) => onChange({ [q.id]: e.target.value })} />
            )}
          </Field>
        );
      })}
    </>
  );
}

export function answerError(q: Question) {
  return q.type === "choice" || q.type === "multi" ? "Choose an answer" : "Answer this question";
}
