<script setup lang="ts">
/** The Figma "Verify your business" screens sit in a centred 558px column inside the app panel. */
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div :class="cn('mx-auto w-full max-w-[558px]', props.class)"><slot /></div>
</template>
