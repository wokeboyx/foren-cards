<script setup lang="ts">
import { formatRate, rate } from "@/domain/money";
import type { Currency } from "@/domain/types";

defineProps<{ local: Currency; home: Currency; fee: number }>();
</script>

<template>
  <div class="rounded-[16px] bg-surface p-4 text-center ring-1 ring-line">
    <div class="tnum text-[18px] font-semibold text-fg">{{ formatRate(local, home, rate(local, home)) }}</div>
    <div class="mt-0.5 text-[13px] text-fg-2">{{ local === home ? "No conversion needed" : `${(fee / 100).toFixed(1)}% conversion fee if paid from ${home} · today’s test rate` }}</div>
  </div>
</template>
