<script setup lang="ts">
// Numbered checklist on the left of a panel: done = dark tick, current = accent number, later = outlined.
import { RiCheckLine } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ink, muted } from "./shared";

defineProps<{ steps: string[]; current: number }>();
</script>

<template>
  <ol class="flex flex-col gap-4">
    <li
      v-for="(s, i) in steps"
      :key="s"
      class="flex items-center gap-3"
      :aria-current="i === current ? 'step' : undefined"
    >
      <span
        :class="
          cn(
            'grid size-9 shrink-0 place-items-center rounded-full text-[15px] font-semibold transition-colors',
            i < current && 'bg-[#ebe9e5] text-[#2f2d2b]',
            i === current && 'bg-[#1e1711] text-white',
            i > current && 'border border-[#e6e4e2] text-[#95908b]',
          )
        "
      >
        <RiCheckLine v-if="i < current" class="size-5" aria-hidden="true" />
        <template v-else>{{ i + 1 }}</template>
      </span>
      <span
        :class="
          cn(
            'text-[17px] font-medium transition-colors',
            i <= current ? ink : muted,
          )
        "
      >
        {{ s }}
        <span v-if="i < current" class="sr-only"> (done)</span>
      </span>
    </li>
  </ol>
</template>
