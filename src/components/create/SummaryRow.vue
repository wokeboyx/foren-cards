<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <div class="flex items-start justify-between gap-4 py-2.5">
    <dt class="shrink-0 text-fg-3">{{ label }}</dt>
    <dd class="tnum text-right text-fg"><slot /></dd>
  </div>
</template>
