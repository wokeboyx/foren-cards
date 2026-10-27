<script setup lang="ts">
// Left column of every tab: display headline, one-line description, then whatever the tab needs.
import { cn } from "@/lib/utils";
import { ink, muted } from "./shared";

defineProps<{ title?: string; description: string }>();
</script>

<template>
  <div class="flex flex-col gap-8 lg:pt-6">
    <div class="flex flex-col gap-4">
      <h2 :class="cn('max-w-[420px] font-display text-[32px] leading-[52px] font-medium tracking-[-0.4px]', ink)">
        <slot name="title">{{ title }}</slot>
      </h2>
      <p :class="cn('max-w-[480px] text-[16px] leading-[24px] tracking-[-0.08px]', muted)">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>
