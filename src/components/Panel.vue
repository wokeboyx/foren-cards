<script setup lang="ts">
/** A white rounded surface — the standard Foren panel. Other attributes fall through to the div. */
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div :class="cn('rounded-[20px] bg-surface', props.class)"><slot /></div>
</template>
