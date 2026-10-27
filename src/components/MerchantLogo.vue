<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import type { Merchant } from "@/domain/types";
import { cn } from "@/lib/utils";

/** Letter tile standing in for a merchant logo (prototype has no licensed logo assets). */
const props = withDefaults(defineProps<{ merchant?: Merchant; size?: number; class?: HTMLAttributes["class"] }>(), { size: 36 });

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio — pick whichever letter colour reads best on the brand tint. */
function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const text = computed(() => (props.merchant && contrast("#ffffff", props.merchant.tint) >= contrast("#241c15", props.merchant.tint) ? "#ffffff" : "#241c15"));
</script>

<template>
  <span
    v-if="!merchant"
    aria-hidden="true"
    :class="cn('inline-grid shrink-0 place-items-center rounded-full bg-subtle text-fg-3', props.class)"
    :style="{ width: `${size}px`, height: `${size}px` }"
  />
  <span
    v-else
    aria-hidden="true"
    :class="cn('inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-[0.01em]', props.class)"
    :style="{ width: `${size}px`, height: `${size}px`, background: merchant.tint, color: text, fontSize: `${Math.round(size * 0.36)}px` }"
  >
    {{ merchant.mark }}
  </span>
</template>
