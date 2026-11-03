<script setup lang="ts">
import type { Card } from "@/domain/types";
import { cardEvents } from "./card-history";

/** Revolut-style "See history": what changed, when, and who did it. */
defineProps<{ card: Card }>();

function when(at: string) {
  const d = new Date(at);
  const today = new Date();
  const time = d.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
  return d.toDateString() === today.toDateString()
    ? `Today, ${time}`
    : `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${time}`;
}
</script>

<template>
  <ol class="divide-y divide-line">
    <li v-for="(e, i) in cardEvents(card)" :key="`${e.at}-${i}`" class="py-3">
      <div class="text-[14px] leading-[20px] font-medium text-fg">
        {{ e.text }}
      </div>
      <div class="mt-0.5 text-[12px] text-fg-3">
        {{ when(e.at) }} · {{ e.by }}
      </div>
    </li>
  </ol>
</template>
