"use client";
import * as React from "react";
import { CheckBoldIcon, LightbulbIcon } from "@/components/icons";
import { Field, fieldCls } from "@/components/onboarding/frame";
import type { Answers, Question } from "@/domain/questionnaires";
import { cn } from "@/lib/utils";

/** DS text area: same fill, radius and focus as the inputs (no border at rest). */
const textareaCls = cn(fieldCls, "h-auto min-h-[112px] resize-y py-3");

/**
 * Renders questions from domain/questionnaires.ts. Each field's first control has id `q-<question id>`, for focusing the first error.
 * Choices are selectable cards (Mercury/Revolut pattern): two short options sit side by side, longer lists stack.
 * Free-text questions can carry a sample answer (Airwallex pattern) so people know how much to write.
 */
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
        const label = q.optional ? (
          <>
            {q.label} <span className="font-normal text-fg-3">(optional)</span>
          </>
        ) : (
          q.label
        );

        if (q.type === "choice" || q.type === "multi") return <ChoiceQuestion key={q.id} id={id} q={q} label={label} value={value} error={error} onChange={(v) => onChange({ [q.id]: v })} />;

        const field = (
          <Field key={q.id} label={label} description={q.description} htmlFor={id} error={error}>
            {q.type === "long" ? (
              <textarea id={id} className={textareaCls} value={value} aria-invalid={!!error} onChange={(e) => onChange({ [q.id]: e.target.value })} />
            ) : (
              <input id={id} className={fieldCls} value={value} aria-invalid={!!error} onChange={(e) => onChange({ [q.id]: e.target.value })} />
            )}
          </Field>
        );
        return q.example ? (
          <div key={q.id} className="flex flex-col gap-3">
            {field}
            <Example text={q.example} />
          </div>
        ) : (
          field
        );
      })}
    </>
  );
}

function ChoiceQuestion({
  id,
  q,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  q: Question;
  label: React.ReactNode;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const multi = q.type === "multi";
  const options = q.options ?? [];
  const list = value ? value.split(",") : [];
  const inline = options.length <= 3 && options.every((o) => o.length <= 14);
  const descId = `${id}-desc`;
  const name = `q-${q.id}`;

  return (
    <fieldset className="flex min-w-0 flex-col gap-2" aria-invalid={!!error || undefined} aria-describedby={q.description ? descId : undefined}>
      <legend className="mb-2 text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg">{label}</legend>
      <div className={cn("grid gap-2", inline ? "grid-cols-2 sm:flex sm:flex-wrap" : "grid-cols-1")}>
        {options.map((o, i) => {
          const checked = multi ? list.includes(o) : value === o;
          return (
            <label
              key={o}
              className={cn(
                "relative flex min-h-12 cursor-pointer items-center gap-3 rounded-[16px] border bg-subtle px-3 py-3 text-[14px] leading-[21px] font-medium tracking-[0.01em] text-fg transition-[border-color,background-color] duration-150",
                "has-[:focus-visible]:border-[var(--color-foren-border-active)] has-[:focus-visible]:shadow-[0_0_0_6px_var(--color-foren-ring-active)]",
                checked ? "border-[var(--color-foren-brand-green)] bg-surface" : "border-transparent hover:border-line-2",
                inline && "sm:min-w-[120px]",
                error && !checked && "border-error"
              )}
            >
              <input
                id={i === 0 ? id : undefined}
                type={multi ? "checkbox" : "radio"}
                name={name}
                value={o}
                checked={checked}
                onChange={() => onChange(multi ? (checked ? list.filter((x) => x !== o) : [...list, o]).join(",") : o)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "grid size-4 shrink-0 place-items-center border",
                  multi ? "rounded-[4px]" : "rounded-full",
                  checked ? "border-[var(--color-foren-brand-green)] bg-[var(--color-foren-brand-green)] text-white" : "border-line-2 bg-surface"
                )}
              >
                {checked && (multi ? <CheckBoldIcon className="size-3" /> : <span className="size-1.5 rounded-full bg-white" />)}
              </span>
              {o}
            </label>
          );
        })}
      </div>
      {q.description && (
        <p id={descId} className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-3">
          {q.description}
        </p>
      )}
      {error && (
        <p role="alert" className="text-[12px] leading-[18px] font-medium text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Sample answer under a free-text question. */
function Example({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-[16px] border border-line bg-surface px-3 py-3">
      <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <p className="text-[12px] leading-[18px] font-medium tracking-[0.01em] text-fg-2">
        <span className="font-semibold text-fg">Example: </span>
        {text}
      </p>
    </div>
  );
}

export function answerError(q: Question) {
  return q.type === "choice" || q.type === "multi" ? "Choose an answer" : "Answer this question";
}
