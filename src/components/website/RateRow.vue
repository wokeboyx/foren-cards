<script setup lang="ts">
import { cn } from "@/lib/utils";
import { muted } from "./shared";

defineProps<{ label: string }>();
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <span :class="cn('text-[14px] font-medium tracking-[0.14px]', muted)">{{ label }}</span>
    <slot />
  </div>
</template>
