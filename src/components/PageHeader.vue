<script setup lang="ts">
/**
 * Page title block, spaced like the Foren Business Banking Figma: title and description 8px apart,
 * actions on the right, optional tabs below, and 24px to the content that follows.
 * Slots: title, description, badge, actions, tabs.
 */
defineProps<{ title?: string; description?: string }>();
const slots = defineSlots<{ title?(): unknown; description?(): unknown; badge?(): unknown; actions?(): unknown; tabs?(): unknown }>();
</script>

<template>
  <header class="mb-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-[24px] leading-[32px] font-semibold tracking-[-0.01em] text-fg"><slot name="title">{{ title }}</slot></h1>
          <slot name="badge" />
        </div>
        <p v-if="description || slots.description" class="text-[14px] leading-[21px] text-fg-2"><slot name="description">{{ description }}</slot></p>
      </div>
      <div v-if="slots.actions" class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 [&>*]:flex-1 sm:[&>*]:flex-none"><slot name="actions" /></div>
    </div>
    <div v-if="slots.tabs" class="mt-6 max-w-full overflow-x-auto"><slot name="tabs" /></div>
  </header>
</template>
