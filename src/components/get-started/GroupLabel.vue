<script setup lang="ts">
/** Uppercase group label (Figma "TODO", "FROM COMPANY HOUSE", "REQUIRES ACTION"). */
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <h2 :class="cn('mb-3 text-[12px] leading-[18px] font-semibold tracking-[0.04em] text-fg-3 uppercase', props.class)"><slot /></h2>
</template>
