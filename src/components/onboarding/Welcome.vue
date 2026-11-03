<script setup lang="ts">
/** "Welcome to Foren." after sign-up (Figma 3035:75292 / 3240:69245). Full page, no step rail. */
import { computed, watchEffect, type Component } from "vue";
import { useRouter } from "vue-router";
import {
  RiFileTextLine,
  RiNotification3Line,
  RiQuestionnaireLine,
  RiShieldCheckLine,
  RiTeamLine,
  RiTimeLine,
  RiUserLine,
} from "@/components/icons";
import LinkButton from "@/components/LinkButton.vue";
import { useSignupGuard } from "@/composables/useSignupGuard";
import { asset } from "@/lib/base-path";
import { checklist, useOnboardingStore } from "@/stores/onboarding";

const ready = useSignupGuard("/onboarding/welcome");
const router = useRouter();
const s = useOnboardingStore();
const signedUp = computed(() => !!s.signedUpAt);

watchEffect(() => {
  if (ready.value && !signedUp.value) router.replace("/onboarding/review");
});

const tasks = computed(() => {
  const ids = new Set(checklist(s.$state).map((i) => i.id));
  return [
    ids.has("documents") && {
      icon: RiFileTextLine,
      label: "Upload your documents",
      time: "~5 min",
    },
    ids.has("stakeholders") && {
      icon: RiTeamLine,
      label: "Add management & ownership",
      time: "~4 min",
    },
    ids.has("questionnaire") && {
      icon: RiQuestionnaireLine,
      label: "Answer a short questionnaire",
      time: "~3 min",
    },
    {
      icon: RiShieldCheckLine,
      label: "Pass compliance review",
      time: "1–2 days",
    },
  ].filter(Boolean) as { icon: Component; label: string; time: string }[];
});
const count = computed(
  () =>
    ["", "one", "two", "three", "four", "five"][tasks.value.length] ??
    String(tasks.value.length),
);
</script>

<template>
  <div
    v-if="ready && signedUp && s.business"
    class="min-h-dvh bg-surface p-0 lg:p-2"
  >
    <div
      class="relative min-h-dvh overflow-hidden bg-canvas lg:min-h-[calc(100dvh-16px)] lg:rounded-[20px]"
    >
      <!-- Soft pink wash with a hint of green, as in the Figma frame. -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-[radial-gradient(60%_120%_at_50%_-20%,#f9dcdc_0%,transparent_70%),radial-gradient(30%_80%_at_0%_10%,#d8f1cf_0%,transparent_70%)] opacity-90"
      />
      <header
        class="relative flex items-center justify-between px-5 pt-5 lg:px-6 lg:pt-6"
      >
        <img
          :src="asset('/onboarding/foren-wordmark.svg')"
          alt="Foren"
          width="100"
          height="24"
        />
        <div class="flex items-center gap-3 text-fg">
          <span
            class="grid size-8 place-items-center rounded-full bg-surface ring-1 ring-line"
            aria-hidden="true"
          >
            <RiNotification3Line class="size-4" />
          </span>
          <span
            class="grid size-8 place-items-center rounded-full bg-surface ring-1 ring-line"
            aria-hidden="true"
          >
            <RiUserLine class="size-4" />
          </span>
        </div>
      </header>

      <main
        id="main"
        class="relative mx-auto flex w-full max-w-[400px] flex-col gap-4 px-5 pt-16 pb-16 lg:pt-[120px]"
      >
        <div
          class="overflow-hidden rounded-[20px] bg-surface shadow-[var(--shadow-foren-xs)] ring-1 ring-line animate-[rise-in_300ms_ease-out]"
        >
          <div class="relative h-[110px] overflow-hidden">
            <img
              :src="asset('/onboarding/welcome-texture.jpg')"
              alt=""
              class="absolute inset-0 size-full object-cover"
            />
            <img
              :src="asset('/onboarding/coins.png')"
              alt=""
              width="420"
              height="420"
              class="absolute top-[-128px] left-1/2 max-w-none -translate-x-1/2 object-contain"
            />
          </div>
          <div class="flex flex-col gap-6 px-4 pt-6 pb-5">
            <div class="flex flex-col gap-2 text-center">
              <h1
                class="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]"
              >
                Welcome to Foren.
              </h1>
              <p class="text-[14px] leading-[21px] font-medium text-fg-2">
                Your details are in,
                <span class="font-semibold text-fg">{{ s.business.name }}</span
                >. Activate your account to open your dashboard and finish the
                last {{ count }} steps.
              </p>
            </div>
            <ul class="flex flex-col gap-3" aria-label="Steps left">
              <li
                v-for="t in tasks"
                :key="t.label"
                class="flex items-center gap-3"
              >
                <span
                  class="grid size-7 shrink-0 place-items-center rounded-full bg-info-subtle text-info"
                  aria-hidden="true"
                >
                  <component :is="t.icon" class="size-[14px]" />
                </span>
                <span
                  class="flex-1 text-[14px] leading-[21px] font-medium text-fg"
                  >{{ t.label }}</span
                >
                <span
                  class="inline-flex shrink-0 items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-[12px] font-medium text-fg-3"
                >
                  <RiTimeLine class="size-3" aria-hidden="true" />
                  {{ t.time }}
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <LinkButton href="/cards" variant="outline" size="xs"
            >Explore features</LinkButton
          >
          <LinkButton href="/get-started" size="xs"
            >Activate my account</LinkButton
          >
        </div>
      </main>
    </div>
  </div>
</template>
