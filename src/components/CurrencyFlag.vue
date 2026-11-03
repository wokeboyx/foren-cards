<script setup lang="ts">
import { computed, type HTMLAttributes } from "vue";
import type { Currency } from "@/domain/types";
import { cn } from "@/lib/utils";
import { asset } from "@/lib/base-path";

const PNG: Partial<Record<Currency, string>> = {
  USD: asset("/foren/wallet/flag-usd.png"),
  GBP: asset("/foren/wallet/flag-gbp.png"),
  CAD: asset("/foren/wallet/flag-cad.png"),
};

/** Round currency flag. Decorative: the currency is always named next to it. */
const props = withDefaults(
  defineProps<{
    currency: Currency;
    size?: number;
    class?: HTMLAttributes["class"];
  }>(),
  { size: 24 },
);

const box = computed(() =>
  cn(
    "inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-black/10",
    props.class,
  ),
);
const png = computed(() => PNG[props.currency]);
const stars = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  return { cx: 12 + 6.5 * Math.sin(a), cy: 12 - 6.5 * Math.cos(a) };
});
</script>

<template>
  <img
    v-if="png"
    :src="png"
    alt=""
    :width="size"
    :height="size"
    :class="box"
    aria-hidden="true"
  />
  <svg
    v-else
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    :class="box"
    aria-hidden="true"
  >
    <template v-if="currency === 'NGN'">
      <rect width="8" height="24" fill="#008751" />
      <rect x="8" width="8" height="24" fill="#ffffff" />
      <rect x="16" width="8" height="24" fill="#008751" />
    </template>
    <template v-else>
      <rect width="24" height="24" fill="#003399" />
      <circle
        v-for="(s, i) in stars"
        :key="i"
        :cx="s.cx"
        :cy="s.cy"
        r="1"
        fill="#ffcc00"
      />
    </template>
  </svg>
</template>
