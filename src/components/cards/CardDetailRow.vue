<script setup lang="ts">
import { RiFileCopyLine } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import { cn } from "@/lib/utils";

/** `copyable` false hides the copy button but keeps its space. */
defineProps<{ label: string; value: string; copyable: boolean }>();
const emit = defineEmits<{ copy: [] }>();
</script>

<template>
  <div class="flex items-center justify-between gap-3 py-2.5">
    <div class="min-w-0">
      <div class="text-[12px] text-fg-3">{{ label }}</div>
      <div class="tnum truncate text-[14px] font-medium tracking-[0.02em] text-fg">{{ value }}</div>
    </div>
    <ForenButton
      variant="ghost"
      size="xxs"
      :aria-label="`Copy ${label.toLowerCase()}`"
      :disabled="!copyable"
      :class="cn('px-2', !copyable && 'invisible')"
      @click="emit('copy')"
    >
      <template #leadingIcon><RiFileCopyLine /></template>
    </ForenButton>
  </div>
</template>
