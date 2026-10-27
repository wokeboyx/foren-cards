<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<template>
  <div class="mt-6">
    <h3 class="mb-2 text-[12px] font-semibold tracking-[0.01em] text-fg-3 uppercase">{{ title }}</h3>
    <ul class="divide-y divide-line rounded-[20px] border border-line"><slot /></ul>
  </div>
</template>
