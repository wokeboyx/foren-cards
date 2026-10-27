<script setup lang="ts">
import { computed } from "vue";
import ForenProgress from "@/components/ui/ForenProgress.vue";
import type { Card, Transaction } from "@/domain/types";
import { spendSummary } from "./spend-meter";

const props = defineProps<{ card: Card; txns: Transaction[]; now: Date; compact?: boolean }>();
const s = computed(() => spendSummary(props.card, props.txns, props.now));
const fill = computed(() => (s.value.ratio !== null && s.value.ratio >= 0.9 ? "var(--color-foren-warning)" : undefined));
</script>

<template>
  <div v-if="compact" class="min-w-[140px]">
    <div class="tnum text-[13px] font-medium text-fg">{{ s.short }}</div>
    <ForenProgress v-if="s.ratio !== null" size="sm" :value="s.ratio * 100" hide-value class="mt-1.5" :aria-label="s.sentence" :fill-color="fill" />
    <div v-else class="mt-0.5 text-[12px] text-fg-3">Per-charge limit</div>
  </div>
  <div v-else>
    <ForenProgress v-if="s.ratio !== null" size="md" :value="s.ratio * 100" hide-value aria-label="Spend against limit" :fill-color="fill" />
    <p class="tnum mt-2 text-[14px] leading-[22px] text-fg-2">{{ s.sentence }}</p>
  </div>
</template>
