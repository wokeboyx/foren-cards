<script setup lang="ts">
/**
 * The loading page from the Figma money flows ("Sending"): a 48px spinner, what's happening in one line, and a note not to
 * close the page. It covers the whole screen while a card is created, funded or a request is sent, and has no close
 * button because closing now would leave the outcome unknown.
 */
import ForenSpinner from "@/components/ui/ForenSpinner.vue";
import SuccessGlow from "@/components/SuccessGlow.vue";
import FocusFrame from "./FocusFrame.vue";

defineProps<{ title: string; description?: string }>();
</script>

<template>
  <div class="fixed inset-0 z-[90] overflow-y-auto bg-surface">
    <FocusFrame center :closable="false">
      <SuccessGlow />
      <div
        class="flex w-full max-w-[532px] flex-col items-center gap-6 px-5 pb-32 text-center"
      >
        <ForenSpinner size="xl" aria-label="Processing" />
        <div class="flex flex-col gap-2">
          <h1
            class="text-[20px] leading-[30px] font-semibold tracking-[-0.2px] text-fg [font-feature-settings:'calt'_0]"
          >
            {{ title }}
          </h1>
          <p
            class="text-[16px] leading-[24px] font-medium tracking-[0.08px] text-fg-2 [font-feature-settings:'calt'_0]"
          >
            {{
              description ??
              "This is being processed. It usually takes a few seconds. Please do not close or refresh this page."
            }}
          </p>
        </div>
      </div>
    </FocusFrame>
  </div>
</template>
