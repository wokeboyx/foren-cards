<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <section class="mb-4 border-t border-line pt-3">
    <div class="mb-2 text-[11px] font-semibold tracking-[0.06em] text-fg-3 uppercase">{{ label }}</div>
    <slot />
  </section>
</template>
