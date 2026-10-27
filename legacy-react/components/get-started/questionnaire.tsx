"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormQuestions, answerError } from "@/components/onboarding/form-questions";
import { ForenButton } from "@/components/ui/foren-button";
import { bankingQuestionnaire, fusionQuestionnaire, unanswered, visible, type Answers, type Question } from "@/domain/questionnaires";
import { useOnboarding, useRequirementContext } from "@/lib/onboarding-store";
import { Note, SetupColumn, SetupHeader } from "./shared";

/** The onboarding questionnaire from the Google Forms (domain/questionnaires.ts): business banking, Fusion API, or both. */
export function QuestionnairePage() {
  const ctx = useRequirementContext();
  const s = useOnboarding();
  const router = useRouter();
  const [tried, setTried] = React.useState(false);

  if (!ctx || !s.signedUpAt)
    return (
      <SetupColumn>
        <SetupHeader back="/get-started" title="Onboarding questionnaire" description="Finish sign-up first." />
      </SetupColumn>
    );

  const q = s.questionnaire;
  const banking = ctx.entity !== "mto" && ctx.banking !== false;
  const api = !!ctx.api;
  const financialServices = ctx.entity === "mto" || s.profile?.sector === "Financial services";
  const groups = [...(banking ? bankingQuestionnaire(ctx.country) : []), ...(api ? fusionQuestionnaire(financialServices) : [])];
  const shown = visible(groups, q).filter((g) => g.questions.length);
  const locked = s.questionnaireSubmitted;

  const upd = (patch: Answers) => s.set({ questionnaire: { ...q, ...patch } });
  const missing = unanswered(groups, q);
  const errorFor = (question: Question) => (tried && missing.includes(question) ? answerError(question) : undefined);

  const submit = () => {
    setTried(true);
    if (missing.length) {
      document.getElementById(`q-${missing[0].id}`)?.focus();
      return;
    }
    s.set({ questionnaireSubmitted: true });
    toast.success("Questionnaire submitted");
    router.push("/get-started");
  };

  return (
    <SetupColumn>
      <SetupHeader
        back="/get-started"
        title={banking ? "Onboarding questionnaire" : "API onboarding"}
        description={banking ? "A few questions about how you’ll use your account. Your answers save as you go." : "Tell us about your business and the API services you need. Your answers save as you go."}
      />
      {locked && (
        <Note intent="success" className="mb-6">
          Submitted. You can’t change these answers while we review them.
        </Note>
      )}
      <fieldset disabled={locked} className="flex flex-col gap-6">
        {shown.map((g) => (
          <section key={g.key} className="flex flex-col gap-8 rounded-[24px] bg-surface px-4 py-6">
            {shown.length > 1 && <h2 className="text-[16px] leading-[24px] font-semibold text-fg">{g.key === "banking" ? "Business banking" : g.key === "api" ? "API onboarding" : g.title}</h2>}
            <FormQuestions questions={g.questions} answers={q} onChange={upd} errorFor={errorFor} />
          </section>
        ))}
      </fieldset>

      {tried && missing.length > 0 && (
        <Note intent="error" className="mt-6">
          Answer the {missing.length === 1 ? "question" : `${missing.length} questions`} marked above to continue.
        </Note>
      )}
      {!locked && (
        <ForenButton size="md" className="mt-6 w-full" onClick={submit}>
          Submit answers
        </ForenButton>
      )}
    </SetupColumn>
  );
}
