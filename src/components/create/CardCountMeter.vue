<script setup lang="ts">
/** How many of the account's active cards are used: a ring that fills as cards are added, with what's left in the middle. */
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ used: number; max: number; adding?: number }>();
const adding = computed(() => props.adding ?? 0);
const after = computed(() => props.used + adding.value);
const left = computed(() => Math.max(props.max - after.value, 0));
const tone = computed(() =>
  after.value > props.max ? "error" : left.value <= 3 ? "warning" : "ok",
);

const R = 26;
const C = 2 * Math.PI * R;
const arc = (n: number) => (Math.min(n, props.max) / props.max) * C;
const usedArc = computed(() => arc(props.used));
const addArc = computed(() => arc(after.value) - arc(props.used));
const addColour = computed(() =>
  tone.value === "error"
    ? "var(--color-foren-error)"
    : tone.value === "warning"
      ? "var(--color-foren-warning)"
      : "var(--color-foren-brand-green)",
);
</script>

<template>
  <div
    class="flex items-center gap-4 rounded-[16px] border border-line bg-surface px-4 py-3.5"
  >
    <div
      role="meter"
      aria-label="Active cards used"
      :aria-valuemin="0"
      :aria-valuemax="max"
      :aria-valuenow="Math.min(after, max)"
      :aria-valuetext="`${after} of ${max} cards once this is created`"
      class="relative size-[68px] shrink-0"
    >
      <svg viewBox="0 0 68 68" class="size-full -rotate-90" aria-hidden="true">
        <circle
          cx="34"
          cy="34"
          :r="R"
          fill="none"
          stroke="var(--color-foren-border-muted)"
          stroke-width="7"
        />
        <circle
          cx="34"
          cy="34"
          :r="R"
          fill="none"
          stroke="var(--color-foren-text-primary)"
          stroke-width="7"
          stroke-linecap="butt"
          :stroke-dasharray="`${usedArc} ${C}`"
        />
        <circle
          v-if="addArc > 0"
          cx="34"
          cy="34"
          :r="R"
          fill="none"
          :stroke="addColour"
          stroke-width="7"
          :stroke-dasharray="`${addArc} ${C}`"
          :stroke-dashoffset="-usedArc"
          class="transition-[stroke-dasharray,stroke-dashoffset] duration-300"
        />
      </svg>
      <div
        class="absolute inset-0 grid place-content-center text-center leading-none"
      >
        <span class="tnum text-[18px] font-semibold text-fg">{{ left }}</span>
        <span
          class="mt-0.5 text-[10px] font-medium tracking-[0.04em] text-fg-3 uppercase"
          >left</span
        >
      </div>
    </div>
    <div class="min-w-0">
      <p class="text-[14px] leading-[21px] font-semibold text-fg">
        {{ used }} of {{ max }} active cards used
      </p>
      <p
        :class="
          cn(
            'mt-0.5 text-[13px] leading-[18px]',
            tone === 'error'
              ? 'font-medium text-error'
              : tone === 'warning' && adding
                ? 'text-warning'
                : 'text-fg-3',
          )
        "
      >
        <template v-if="tone === 'error'"
          >This would go over the limit by {{ after - max }}.</template
        >
        <template v-else-if="adding">
          {{ adding === 1 ? "This card takes" : `These ${adding} cards take` }}
          {{ adding === 1 ? "one" : adding }}.
          {{ left === 0 ? "None left after." : `${left} left after.` }}
        </template>
        <template v-else>{{
          left === 1 ? "1 card left" : `${left} cards left`
        }}</template>
      </p>
    </div>
  </div>
</template>
