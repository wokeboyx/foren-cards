<script setup lang="ts">
defineProps<{ title: string; body: string }>();
defineSlots<{ icon(): unknown; action(): unknown }>();
</script>

<template>
  <div class="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
    <span class="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-fg-2 [&_svg]:size-[18px]" aria-hidden="true">
      <slot name="icon" />
    </span>
    <div class="min-w-0 flex-1">
      <div class="text-[14px] font-semibold text-fg">{{ title }}</div>
      <div class="text-[12px] leading-[16px] text-fg-3">{{ body }}</div>
    </div>
    <div class="shrink-0"><slot name="action" /></div>
  </div>
</template>
