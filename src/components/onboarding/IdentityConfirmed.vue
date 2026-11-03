<script setup lang="ts">
import { useRouter } from "vue-router";
import ForenButton from "@/components/ui/ForenButton.vue";
import { useSignupGuard } from "@/composables/useSignupGuard";
import { asset } from "@/lib/base-path";
import OnboardingFrame from "./OnboardingFrame.vue";

const router = useRouter();
const ok = useSignupGuard("/onboarding/identity/confirmed");
</script>

<template>
  <OnboardingFrame v-if="ok" step="identity" bare completed>
    <div
      class="flex flex-col items-center gap-6 pt-[120px] text-center lg:pt-[140px]"
    >
      <img
        :src="asset('/onboarding/check.png')"
        alt=""
        width="96"
        height="96"
      />
      <div class="flex flex-col gap-2">
        <h1
          class="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none] lg:text-[28px] lg:leading-[36px]"
        >
          Identity confirmed
        </h1>
        <p
          class="max-w-[300px] text-[14px] leading-[21px] font-medium text-fg-2"
        >
          Your verification is complete. Next, add your official business
          details.
        </p>
      </div>
      <ForenButton
        size="xs"
        class="px-5"
        @click="router.push('/onboarding/business')"
        >Continue to business details</ForenButton
      >
    </div>
  </OnboardingFrame>
</template>
