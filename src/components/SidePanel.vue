<script setup lang="ts">
/** Mercury-style inline detail panel beside a list (desktop). Phones use a full-screen Sheet instead. */
import { RiCloseLine } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";

defineProps<{ label: string }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <aside :aria-label="label" class="sticky top-[84px] max-h-[calc(100dvh-100px)] overflow-y-auto rounded-[20px] bg-surface shadow-[var(--shadow-foren-sm)] ring-1 ring-line">
    <div class="sticky top-0 z-10 flex justify-end px-3 pt-3">
      <ForenButton variant="ghost" size="xxs" :aria-label="`Close ${label.toLowerCase()}`" class="bg-surface px-2" @click="emit('close')">
        <template #leadingIcon><RiCloseLine /></template>
      </ForenButton>
    </div>
    <div class="-mt-6"><slot /></div>
  </aside>
</template>
