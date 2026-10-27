<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div aria-hidden="true" :class="cn('animate-pulse rounded-md bg-subtle', props.class)" />
</template>
