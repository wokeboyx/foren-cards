<script setup lang="ts">
import { RiFileCopyLine } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";

defineProps<{ label: string; value: string; canCopy: boolean }>();
const emit = defineEmits<{ copy: [] }>();
</script>

<template>
  <div
    class="flex items-center justify-between gap-2 rounded-[16px] bg-subtle px-3.5 py-2.5"
  >
    <div class="min-w-0">
      <div class="text-[12px] text-fg-3">{{ label }}</div>
      <div
        class="tnum truncate text-[15px] font-semibold tracking-[0.04em] text-fg"
      >
        {{ value }}
      </div>
    </div>
    <ForenButton
      variant="ghost"
      size="xxs"
      :aria-label="`Copy ${label.toLowerCase()}`"
      :disabled="!canCopy"
      class="px-2"
      @click="emit('copy')"
    >
      <template #leadingIcon><RiFileCopyLine /></template>
    </ForenButton>
  </div>
</template>
