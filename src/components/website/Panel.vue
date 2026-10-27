<script setup lang="ts">
// Inner panel of the glass card ("SendR" and "Header" in Figma).
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div :class="cn('rounded-[24px] border border-[rgba(198,178,187,0.2)] bg-[rgba(243,243,243,0.95)]', props.class)"><slot /></div>
</template>
