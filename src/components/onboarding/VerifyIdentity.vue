<script setup lang="ts">
import { computed, ref } from "vue";
import { RiAsterisk, RiErrorWarningLine } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import { acceptedIds } from "@/domain/onboarding";
import { useSignupGuard } from "@/composables/useSignupGuard";
import { asset } from "@/lib/base-path";
import { useOnboardingStore } from "@/stores/onboarding";
import IdentityPartnerFlow from "./IdentityPartnerFlow.vue";
import OnboardingFrame from "./OnboardingFrame.vue";

const ok = useSignupGuard("/onboarding/identity");
const store = useOnboardingStore();
const open = ref(false);
const failed = ref(false);
const run = ref(0);

const description = computed(
  () =>
    `Have a valid ID ready (${store.country ? acceptedIds(store.country) : "Passport or national ID"}), then do a quick face check. About 2 mins.`,
);
const notes = [
  "You’ll be taken to our verification partner to finish this step.",
  "Your face scan is encrypted and only used to confirm it’s you.",
];

function start() {
  run.value++;
  failed.value = false;
  open.value = true;
}
function onFailed() {
  open.value = false;
  failed.value = true;
}
</script>

<template>
  <OnboardingFrame
    v-if="ok"
    step="identity"
    back="/onboarding/account"
    title="Verify your identity"
    :description="description"
  >
    <div class="flex flex-col gap-10">
      <div
        class="relative aspect-[310/156] w-full max-w-[310px] overflow-hidden rounded-[16px] bg-subtle sm:max-w-[310px]"
      >
        <img
          :src="asset('/onboarding/verify-identity.jpg')"
          alt=""
          class="absolute inset-0 size-full object-cover"
        />
      </div>

      <div
        v-if="failed"
        role="alert"
        class="flex items-start gap-2 rounded-[16px] bg-error-subtle px-3 py-3 text-[13px] leading-[18px] font-medium text-error"
      >
        <RiErrorWarningLine class="mt-px size-4 shrink-0" aria-hidden="true" />
        We couldn’t read your ID. Make sure all 4 edges are visible and the
        photo is sharp.
      </div>

      <ul class="flex flex-col gap-4">
        <li
          v-for="t in notes"
          :key="t"
          class="flex items-start gap-2 text-[12px] leading-[18px] font-medium text-fg"
        >
          <RiAsterisk
            class="mt-px size-3.5 shrink-0 text-success"
            aria-hidden="true"
          />
          {{ t }}
        </li>
      </ul>

      <ForenButton size="xs" class="w-fit px-6" @click="start">{{
        failed ? "Try again" : "Start verification"
      }}</ForenButton>
    </div>

    <!-- Remounted per attempt so every run starts at the first step. -->
    <IdentityPartnerFlow
      :key="run"
      v-model:open="open"
      :country="store.country"
      @failed="onFailed"
    />
  </OnboardingFrame>
</template>
