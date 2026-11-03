<script setup lang="ts">
defineProps<{ primary: string; secondary: string }>();
</script>

<template>
  <div class="rounded-[12px] border border-line px-3 py-2.5">
    <p class="text-[13px] leading-[19px] font-semibold text-fg">
      {{ primary }}
    </p>
    <p
      v-if="secondary"
      class="text-[12px] leading-[18px] font-medium break-words text-fg-2"
    >
      {{ secondary }}
    </p>
  </div>
</template>
