<script setup lang="ts">
/** White rounded-24 card the Figma uses around form fields (px 16, py 24, 32 between fields). */
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div :class="cn('flex flex-col gap-8 rounded-[24px] bg-surface px-4 py-6', props.class)"><slot /></div>
</template>
