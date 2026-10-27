<script setup lang="ts">
/** Megafield title + one-line description, with the round back button above (Figma). */
import { RiArrowLeftSLine } from "@/components/icons";

defineProps<{ title?: string; description?: string; back?: string }>();
const slots = defineSlots<{ title?(): unknown; description?(): unknown; action?(): unknown }>();
</script>

<template>
  <header class="mb-8 flex flex-col gap-4">
    <div v-if="back || slots.action" class="flex items-center justify-between">
      <RouterLink
        v-if="back"
        :to="back"
        aria-label="Back"
        class="grid size-8 place-items-center rounded-full border border-[rgba(0,0,0,0.07)] bg-surface text-fg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
      >
        <RiArrowLeftSLine class="size-[18px]" aria-hidden="true" />
      </RouterLink>
      <span v-else />
      <slot name="action" />
    </div>
    <div class="flex flex-col gap-2">
      <h1 class="font-display text-[24px] leading-[32px] font-semibold tracking-[-0.015em] text-black [font-synthesis:none]">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p v-if="description || slots.description" class="text-[14px] leading-[21px] font-medium text-fg-2">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>
  </header>
</template>
