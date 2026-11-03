<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import {
  spinnerSizeMap,
  spinnerWrapperVariants,
  type ForenSpinnerProps,
} from "./foren-spinner";

const props = withDefaults(
  defineProps<ForenSpinnerProps & { class?: HTMLAttributes["class"] }>(),
  {
    size: "md",
    trackColor: "var(--color-foren-bg-button-secondary-active)",
    color: "var(--color-foren-brand-green)",
    ariaLabel: "Loading",
  },
);

const geom = computed(() => {
  const { box, stroke } = spinnerSizeMap[props.size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  // 25% arc visible.
  const arcLength = circumference * 0.25;
  return {
    box,
    stroke,
    radius,
    arcLength,
    gapLength: circumference - arcLength,
  };
});
</script>

<template>
  <span
    role="status"
    :aria-label="label ?? ariaLabel"
    aria-live="polite"
    :class="cn(spinnerWrapperVariants({ size }), props.class)"
  >
    <svg
      :width="geom.box"
      :height="geom.box"
      :viewBox="`0 0 ${geom.box} ${geom.box}`"
      fill="none"
      aria-hidden="true"
      style="animation: forenSpinnerRotate 0.8s linear infinite"
    >
      <circle
        :cx="geom.box / 2"
        :cy="geom.box / 2"
        :r="geom.radius"
        :stroke="trackColor"
        :stroke-width="geom.stroke"
      />
      <!-- Start arc at top -->
      <circle
        :cx="geom.box / 2"
        :cy="geom.box / 2"
        :r="geom.radius"
        :stroke="color"
        :stroke-width="geom.stroke"
        stroke-linecap="round"
        :stroke-dasharray="`${geom.arcLength} ${geom.gapLength}`"
        :transform="`rotate(-90 ${geom.box / 2} ${geom.box / 2})`"
      />
    </svg>
    <span
      v-if="label"
      class="font-medium tracking-[0.01em] text-[var(--color-foren-text-secondary)]"
      >{{ label }}</span
    >
  </span>
</template>

<style>
@keyframes forenSpinnerRotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
