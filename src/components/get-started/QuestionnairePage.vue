<script setup lang="ts">
/** The onboarding questionnaire from the Google Forms (domain/questionnaires.ts): business banking, Fusion API, or both. */
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import FormQuestions from "@/components/onboarding/FormQuestions.vue";
import { answerError } from "@/components/onboarding/form-questions";
import ForenButton from "@/components/ui/ForenButton.vue";
import {
  bankingQuestionnaire,
  fusionQuestionnaire,
  unanswered,
  visible,
  type Answers,
  type Question,
} from "@/domain/questionnaires";
import { useOnboardingStore, useRequirementContext } from "@/stores/onboarding";
import Note from "./Note.vue";
import SetupColumn from "./SetupColumn.vue";
import SetupHeader from "./SetupHeader.vue";

const ctx = useRequirementContext();
const s = useOnboardingStore();
const router = useRouter();
const tried = ref(false);

const banking = computed(
  () =>
    !!ctx.value && ctx.value.entity !== "mto" && ctx.value.banking !== false,
);
const api = computed(() => !!ctx.value?.api);
const financialServices = computed(
  () =>
    ctx.value?.entity === "mto" || s.profile?.sector === "Financial services",
);
const groups = computed(() =>
  ctx.value
    ? [
        ...(banking.value ? bankingQuestionnaire(ctx.value.country) : []),
        ...(api.value ? fusionQuestionnaire(financialServices.value) : []),
      ]
    : [],
);
const shown = computed(() =>
  visible(groups.value, s.questionnaire).filter((g) => g.questions.length),
);
const locked = computed(() => s.questionnaireSubmitted);
const missing = computed(() => unanswered(groups.value, s.questionnaire));

const upd = (patch: Answers) =>
  s.set({ questionnaire: { ...s.questionnaire, ...patch } });
const errorFor = (question: Question) =>
  tried.value && missing.value.includes(question)
    ? answerError(question)
    : undefined;

function submit() {
  tried.value = true;
  if (missing.value.length) {
    document.getElementById(`q-${missing.value[0].id}`)?.focus();
    return;
  }
  s.set({ questionnaireSubmitted: true });
  toast.success("Questionnaire submitted");
  router.push("/get-started");
}
</script>

<template>
  <SetupColumn v-if="!ctx || !s.signedUpAt">
    <SetupHeader
      back="/get-started"
      title="Onboarding questionnaire"
      description="Finish sign-up first."
    />
  </SetupColumn>
  <SetupColumn v-else>
    <SetupHeader
      back="/get-started"
      :title="banking ? 'Onboarding questionnaire' : 'API onboarding'"
      :description="
        banking
          ? 'A few questions about how you’ll use your account. Your answers save as you go.'
          : 'Tell us about your business and the API services you need. Your answers save as you go.'
      "
    />
    <Note v-if="locked" intent="success" class="mb-6"
      >Submitted. You can’t change these answers while we review them.</Note
    >
    <fieldset :disabled="locked" class="flex flex-col gap-6">
      <section
        v-for="g in shown"
        :key="g.key"
        class="flex flex-col gap-8 rounded-[24px] bg-surface px-4 py-6"
      >
        <h2
          v-if="shown.length > 1"
          class="text-[16px] leading-[24px] font-semibold text-fg"
        >
          {{
            g.key === "banking"
              ? "Business banking"
              : g.key === "api"
                ? "API onboarding"
                : g.title
          }}
        </h2>
        <FormQuestions
          :questions="g.questions"
          :answers="s.questionnaire"
          :error-for="errorFor"
          @change="upd"
        />
      </section>
    </fieldset>

    <Note v-if="tried && missing.length > 0" intent="error" class="mt-6">
      Answer the
      {{ missing.length === 1 ? "question" : `${missing.length} questions` }}
      marked above to continue.
    </Note>
    <ForenButton v-if="!locked" size="md" class="mt-6 w-full" @click="submit"
      >Submit answers</ForenButton
    >
  </SetupColumn>
</template>
