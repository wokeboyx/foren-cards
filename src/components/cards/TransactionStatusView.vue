<script setup lang="ts">
/**
 * The confirmation page from the Figma money flows ("Request sent"): a green check, a title and one line, a
 * "Transaction status" timeline, an optional reference with a copy button, and one way back.
 */
import { ref, type Component } from "vue";
import SuccessCheck from "@/components/SuccessCheck.vue";
import SuccessGlow from "@/components/SuccessGlow.vue";
import { asset } from "@/lib/base-path";
import ForenButton from "@/components/ui/ForenButton.vue";
import { copyToClipboard } from "./card-detail";

export type StatusStep = { label: string; time?: string; done: boolean };
/** One of the buttons under the status card. */
export type StatusButton = {
  label: string;
  icon?: Component;
  /** The dark main step; the others are outline. */
  primary?: boolean;
  onClick: () => void;
};

defineProps<{
  title: string;
  subtitle: string;
  steps: StatusStep[];
  reference?: string;
  /** Three at most, shown as equal buttons across the column (outline, outline, then the dark main step). */
  buttons: StatusButton[];
}>();
const copied = ref(false);
async function copy(v: string) {
  await copyToClipboard(v);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<template>
  <div class="mx-auto w-full max-w-[456px] px-5 text-center">
    <SuccessGlow />
    <SuccessCheck class="mx-auto" />
    <h1
      class="mt-6 font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] [font-synthesis:none] text-fg"
    >
      {{ title }}
    </h1>
    <p class="mt-1 text-[16px] leading-[24px] text-fg-2">{{ subtitle }}</p>

    <div class="mt-8 overflow-hidden rounded-[20px] bg-subtle text-left">
      <section class="rounded-[20px] bg-surface p-5 ring-1 ring-line">
        <h2 class="text-[15px] font-medium text-fg">Transaction status</h2>
        <ol class="mt-4">
          <li
            v-for="(s, i) in steps"
            :key="s.label"
            class="relative flex gap-3 pb-5 last:pb-0"
          >
            <span
              v-if="i < steps.length - 1"
              class="absolute top-6 left-[9px] h-[calc(100%-20px)] w-0.5 rounded-[1px] bg-line"
              aria-hidden="true"
            />
            <img
              :src="
                asset(
                  s.done
                    ? '/foren/success/dot-done.svg'
                    : '/foren/success/dot-waiting.svg',
                )
              "
              alt=""
              class="relative mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <span>
              <span class="block text-[14px] text-fg">{{ s.label }}</span>
              <span v-if="s.time" class="tnum block text-[12px] text-fg-3">{{
                s.time
              }}</span>
            </span>
          </li>
        </ol>
      </section>
      <div
        v-if="reference"
        class="flex items-center justify-between gap-3 px-5 py-4 text-[14px]"
      >
        <span class="text-fg-2">Request reference</span>
        <span class="flex items-center gap-2 font-medium text-fg">
          <span class="tnum" data-testid="request-reference">{{
            reference
          }}</span>
          <button
            type="button"
            :aria-label="copied ? 'Copied' : 'Copy reference'"
            class="grid size-7 place-items-center rounded-full text-success outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus"
            @click="copy(reference)"
          >
            <img
              :src="asset('/foren/success/copy.svg')"
              alt=""
              class="size-[18px]"
            />
          </button>
        </span>
      </div>
    </div>

    <!-- Figma "Sent" page: equal buttons across the column, outline, outline with an icon, then the dark main step -->
    <div class="mt-5 flex w-full gap-3">
      <ForenButton
        v-for="b in buttons"
        :key="b.label"
        :variant="b.primary ? undefined : 'outline'"
        size="sm"
        class="min-w-0 flex-1 px-3"
        @click="b.onClick"
      >
        <template v-if="b.icon" #leadingIcon
          ><component :is="b.icon"
        /></template>
        {{ b.label }}
      </ForenButton>
    </div>
  </div>
</template>
