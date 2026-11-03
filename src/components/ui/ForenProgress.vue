<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  ref,
  useAttrs,
  watch,
  type HTMLAttributes,
} from "vue";
import { cn } from "@/lib/utils";
import { progressLabelVariants, progressTrackVariants } from "./foren-progress";

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    size?: "sm" | "md" | "lg";
    /** 0–100. Ignored when `indeterminate` is true. */
    value?: number;
    /** Maximum value (defaults to 100). */
    max?: number;
    /** Show looping animation; value ignored. */
    indeterminate?: boolean;
    /** Label above the bar. */
    label?: string;
    /** Hide the percentage display. Defaults to false (visible). */
    hideValue?: boolean;
    /** Override the formatted value text. */
    valueText?: string;
    /** Custom fill color (defaults to Foren Sage 700). */
    fillColor?: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    size: "md",
    value: 0,
    max: 100,
    indeterminate: false,
    hideValue: false,
    fillColor: "var(--color-foren-brand-green)",
  },
);
defineSlots<{ label?(): unknown; valueText?(): unknown }>();
const attrs = useAttrs();

const targetPct = computed(() =>
  Math.max(0, Math.min(100, (props.value / props.max) * 100)),
);
const showHeader = computed(
  () => !!props.label || (!props.hideValue && !props.indeterminate),
);

// Smoothly tween the displayed value so the text rolls instead of snapping.
// Bar width animates from the same source for perfect sync.
const displayPct = ref(targetPct.value);
let raf = 0;
watch([targetPct, () => props.indeterminate], ([end, indeterminate]) => {
  cancelAnimationFrame(raf);
  if (indeterminate) return;
  const start = displayPct.value;
  if (start === end) return;
  const duration = 600;
  const t0 = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic
  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / duration);
    displayPct.value = start + (end - start) * ease(t);
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
});
onBeforeUnmount(() => cancelAnimationFrame(raf));
const rounded = computed(() => Math.round(displayPct.value));
const ariaLabel = computed(
  () =>
    props.label ?? (attrs["aria-label"] as string | undefined) ?? "Progress",
);
</script>

<template>
  <div :class="cn('w-full', props.class)" v-bind="$attrs">
    <div v-if="showHeader" :class="progressLabelVariants({ size })">
      <span class="text-[var(--color-foren-text-primary)] truncate"
        ><slot name="label">{{ label }}</slot></span
      >
      <span
        v-if="!hideValue && !indeterminate"
        class="text-[var(--color-foren-text-tertiary)] tabular-nums shrink-0"
      >
        <slot name="valueText">{{ valueText ?? `${rounded}%` }}</slot>
      </span>
    </div>
    <div
      role="progressbar"
      :aria-valuenow="indeterminate ? undefined : Math.round(targetPct)"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuetext="indeterminate ? 'Loading' : `${Math.round(targetPct)}%`"
      :aria-label="ariaLabel"
      :class="progressTrackVariants({ size })"
    >
      <span
        v-if="indeterminate"
        aria-hidden="true"
        class="absolute inset-y-0 rounded-full"
        :style="{
          backgroundColor: fillColor,
          width: '40%',
          animation:
            'forenProgressIndeterminate 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }"
      />
      <span
        v-else
        aria-hidden="true"
        class="block h-full rounded-full"
        :style="{ width: `${displayPct}%`, backgroundColor: fillColor }"
      />
    </div>
  </div>
</template>
