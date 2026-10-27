<script setup lang="ts">
/**
 * Step 5, MTOs and PSPs only: "Regulatory & Compliance Details" (Figma 3035:75359–75690). The questions are
 * the "Client Onboarding Questionnaire MTO" Google Form, split into three tabs.
 */
import { computed, ref, useTemplateRef, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { MTO_QUESTIONNAIRE, unanswered, visible, type Answers } from "@/domain/questionnaires";
import { useSignupGuard } from "@/composables/useSignupGuard";
import { useOnboardingStore } from "@/stores/onboarding";
import { cn } from "@/lib/utils";
import FormCard from "./FormCard.vue";
import FormQuestions from "./FormQuestions.vue";
import OnboardingFrame from "./OnboardingFrame.vue";

const TABS = MTO_QUESTIONNAIRE;
type TabKey = string;

/** Earlier versions stored lists; keep only text answers. */
function toAnswers(edd: Record<string, string | string[]>): Answers {
  return Object.fromEntries(Object.entries(edd).filter((e): e is [string, string] => typeof e[1] === "string"));
}

const ready = useSignupGuard("/onboarding/compliance");
const router = useRouter();
const store = useOnboardingStore();
const tab = ref<TabKey>(TABS[0].key);
const a = ref<Answers>(toAnswers(store.edd));
const heading = useTemplateRef<HTMLHeadingElement>("heading");

watchEffect(() => {
  if (ready.value && store.entity && store.entity !== "mto") router.replace("/onboarding/review");
});

const valid = (key: TabKey) =>
  unanswered(
    TABS.filter((t) => t.key === key),
    a.value
  ).length === 0;
const index = computed(() => TABS.findIndex((t) => t.key === tab.value));
const current = computed(() => visible([TABS[index.value]], a.value)[0]);

function go(next: TabKey) {
  store.set({ edd: a.value });
  tab.value = next;
  requestAnimationFrame(() => heading.value?.focus());
}
const reachable = (i: number) => i <= index.value || TABS.slice(0, i).every((x) => valid(x.key));

const back = computed(() => (index.value === 0 ? "/onboarding/business/profile" : () => go(TABS[index.value - 1].key)));
const footer = computed(() => ({
  primary: {
    label: index.value === TABS.length - 1 ? "Continue to review" : "Continue",
    disabled: !valid(tab.value),
    onClick: () => {
      if (index.value < TABS.length - 1) return go(TABS[index.value + 1].key);
      store.set({ edd: a.value, edd_done: true });
      router.push("/onboarding/review");
    },
  },
}));
</script>

<template>
  <OnboardingFrame
    v-if="ready && store.entity === 'mto'"
    step="edd"
    :back="back"
    title="Regulatory & Compliance Details"
    description="Tell us about your business activity, fund flow and AML controls to complete your business risk assessment."
    :footer="footer"
  >
    <nav aria-label="Questionnaire sections" class="mb-6">
      <ol class="grid grid-cols-3 gap-2">
        <li v-for="(t, i) in TABS" :key="t.key">
          <button
            type="button"
            :disabled="!reachable(i)"
            :aria-current="t.key === tab ? 'step' : undefined"
            class="flex w-full flex-col gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed"
            @click="go(t.key)"
          >
            <span :class="cn('h-[3px] w-full rounded-full', i <= index ? 'bg-fg' : 'bg-line-2')" aria-hidden="true" />
            <span :class="cn('text-[12px] leading-[18px] font-medium sm:text-[13px]', t.key === tab ? 'text-fg' : i < index ? 'text-fg-2' : 'text-fg-3')">{{
              t.title
            }}</span>
          </button>
        </li>
      </ol>
    </nav>

    <FormCard>
      <h2 ref="heading" tabindex="-1" class="text-[16px] leading-6 font-semibold text-fg outline-none">{{ current.title }}</h2>
      <FormQuestions :questions="current.questions" :answers="a" :error-for="() => undefined" @change="(patch) => (a = { ...a, ...patch })" />
    </FormCard>
  </OnboardingFrame>
</template>
