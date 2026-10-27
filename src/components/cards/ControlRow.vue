<script setup lang="ts">
/** One card control: what it does, what it's set to now, and its switch or button (`action` slot). */
defineProps<{ title: string; desc?: string }>();
defineSlots<{ desc?(): unknown; action?(): unknown }>();
</script>

<template>
  <li class="flex items-center justify-between gap-6 px-5 py-3">
    <div class="min-w-0">
      <div class="text-[14px] leading-[21px] font-medium text-fg">{{ title }}</div>
      <div class="mt-1 text-[14px] leading-[21px] text-fg-3"><slot name="desc">{{ desc }}</slot></div>
    </div>
    <div v-if="$slots.action" class="shrink-0"><slot name="action" /></div>
  </li>
</template>
