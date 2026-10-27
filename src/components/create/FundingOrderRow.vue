<script setup lang="ts">
import { RiArrowDownLine, RiArrowUpLine, RiDraggable } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import Money from "@/components/Money.vue";
import { CURRENCY_NAME } from "@/domain/money";
import type { Currency } from "@/domain/types";

defineProps<{ id: Currency; index: number; total: number; available?: { minor: number; currency: Currency } }>();
const emit = defineEmits<{ move: [dir: -1 | 1] }>();
</script>

<template>
  <li class="flex items-center gap-3 rounded-[14px] border border-line bg-surface px-3 py-2.5">
    <button
      type="button"
      data-drag-handle
      class="cursor-grab rounded-md p-1 text-fg-3 outline-none focus-visible:ring-2 focus-visible:ring-focus active:cursor-grabbing"
      :aria-label="`Drag to reorder ${id}`"
    >
      <RiDraggable class="size-5" aria-hidden="true" />
    </button>
    <span class="tnum grid size-6 place-items-center rounded-full bg-subtle text-[12px] font-semibold text-fg-2">{{ index + 1 }}</span>
    <div class="min-w-0 flex-1">
      <div class="text-[14px] font-semibold text-fg">{{ id }}</div>
      <div class="truncate text-[12px] text-fg-3">
        {{ CURRENCY_NAME[id] }}
        <template v-if="available"> · <Money :value="available" /> available</template>
      </div>
    </div>
    <ForenButton type="button" variant="ghost" size="xxs" class="px-2" :aria-label="`Move ${id} up`" :disabled="index === 0" @click="emit('move', -1)">
      <template #leadingIcon><RiArrowUpLine /></template>
    </ForenButton>
    <ForenButton type="button" variant="ghost" size="xxs" class="px-2" :aria-label="`Move ${id} down`" :disabled="index === total - 1" @click="emit('move', 1)">
      <template #leadingIcon><RiArrowDownLine /></template>
    </ForenButton>
  </li>
</template>
