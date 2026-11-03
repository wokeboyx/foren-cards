<script setup lang="ts">
import { computed, type Component } from "vue";
import { useRouter } from "vue-router";
import {
  RiBankCardLine,
  RiBankLine,
  RiBarChart2Line,
  RiBuilding2Line,
  RiCodeSSlashLine,
  RiExchangeLine,
  RiLinksLine,
  RiSendPlaneLine,
  RiShoppingBag3Line,
  RiTeamLine,
} from "@/components/icons";
import { USE_CASES, type UseCaseId } from "@/domain/onboarding";
import { useSignupGuard } from "@/composables/useSignupGuard";
import { useOnboardingStore } from "@/stores/onboarding";
import { cn } from "@/lib/utils";
import OnboardingFrame from "./OnboardingFrame.vue";

const ICON: Record<UseCaseId, Component> = {
  global_accounts: RiBankLine,
  api: RiCodeSSlashLine,
  payouts: RiSendPlaneLine,
  payment_links: RiLinksLine,
  checkout: RiShoppingBag3Line,
  cards: RiBankCardLine,
  virtual_accounts: RiBuilding2Line,
  fx: RiExchangeLine,
  insights: RiBarChart2Line,
  team: RiTeamLine,
};

const router = useRouter();
const ok = useSignupGuard("/onboarding/use");
const store = useOnboardingStore();

const toggle = (id: UseCaseId) =>
  store.set({
    useCases: store.useCases.includes(id)
      ? store.useCases.filter((x) => x !== id)
      : [...store.useCases, id],
  });
const footer = computed(() => ({
  primary: {
    label: "Continue",
    disabled: store.useCases.length === 0,
    onClick: () => router.push("/onboarding/account"),
  },
}));
</script>

<template>
  <OnboardingFrame
    v-if="ok"
    step="welcome"
    wide
    back="/onboarding"
    title="How do you want to use Foren?"
    description="Select all that apply. Your choice shapes your Foren experience, and you can add more later."
    :footer="footer"
  >
    <fieldset>
      <legend class="sr-only">Products you’ll use</legend>
      <div class="grid gap-3 sm:grid-cols-2">
        <label
          v-for="u in USE_CASES"
          :key="u.id"
          :class="
            cn(
              'relative flex cursor-pointer flex-col gap-4 rounded-[16px] border bg-surface p-4 transition-[border-color,box-shadow] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus',
              store.useCases.includes(u.id)
                ? 'border-success shadow-[var(--shadow-foren-xs)]'
                : 'border-transparent hover:border-line',
            )
          "
        >
          <input
            type="checkbox"
            class="peer sr-only"
            :checked="store.useCases.includes(u.id)"
            @change="toggle(u.id)"
          />
          <span
            aria-hidden="true"
            :class="
              cn(
                'absolute top-4 right-4 grid size-4 place-items-center rounded-full border transition-colors',
                store.useCases.includes(u.id)
                  ? 'border-success'
                  : 'border-line-2',
              )
            "
          >
            <span
              v-if="store.useCases.includes(u.id)"
              class="size-2 rounded-full bg-success"
            />
          </span>
          <component
            :is="ICON[u.id]"
            :class="
              cn(
                'size-6',
                store.useCases.includes(u.id) ? 'text-success' : 'text-fg-2',
              )
            "
            aria-hidden="true"
          />
          <span class="flex flex-col gap-1 pr-4">
            <span class="text-[14px] leading-[21px] font-medium text-fg">{{
              u.title
            }}</span>
            <span class="text-[12px] leading-[18px] font-medium text-fg-3">{{
              u.description
            }}</span>
          </span>
        </label>
      </div>
    </fieldset>
  </OnboardingFrame>
</template>
