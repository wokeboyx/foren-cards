<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { format } from "@/domain/money";
import type { Money } from "@/domain/types";
import { cn } from "@/lib/utils";

/** Monetary value — explicit currency, tabular figures, never wraps mid-amount. */
const props = defineProps<{
  value: Money;
  code?: boolean;
  class?: HTMLAttributes["class"];
  sign?: "+" | "-";
}>();
</script>

<template>
  <span :class="cn('tnum whitespace-nowrap', props.class)"
    >{{ sign }}{{ format(value, { code }) }}</span
  >
</template>
