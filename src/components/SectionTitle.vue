<script setup lang="ts">
/** Slots: default (heading text), action. */
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div :class="cn('flex items-center justify-between gap-3', props.class)">
    <h3 class="text-[16px] leading-[22px] font-semibold tracking-[0.005em] text-fg"><slot /></h3>
    <slot name="action" />
  </div>
</template>
