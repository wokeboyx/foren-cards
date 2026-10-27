<script setup lang="ts">
/** Wise-style tips, adapted to how Foren pays. */
import { computed } from "vue";
import { RiCloseCircleLine, RiExchangeLine, RiShieldCheckLine, RiSnowflakeLine } from "@/components/icons";
import { CURRENCY_NAME } from "@/domain/money";
import type { Currency } from "@/domain/types";

const props = defineProps<{ local: Currency; home: Currency }>();
const tips = computed(() => [
  {
    icon: RiExchangeLine,
    title: `Always choose to pay in ${props.local}`,
    body: `Say no if offered ${props.home === props.local ? "another currency" : CURRENCY_NAME[props.home]}. Foren’s rate is usually better.`,
  },
  { icon: RiShieldCheckLine, title: "Spend like you’re home", body: "The cheapest balance pays automatically." },
  { icon: RiSnowflakeLine, title: "Card details lost or stolen?", body: "Freeze it straight away, then replace it." },
  { icon: RiCloseCircleLine, title: "Back home?", body: "Set trip dates so the card stops when you return." },
]);
</script>

<template>
  <ul class="space-y-4">
    <li v-for="t in tips" :key="t.title" class="flex gap-3">
      <span class="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-fg [&_svg]:size-[18px]" aria-hidden="true">
        <component :is="t.icon" />
      </span>
      <div>
        <div class="text-[14px] font-semibold text-fg">{{ t.title }}</div>
        <p class="text-[13px] leading-[18px] text-fg-2">{{ t.body }}</p>
      </div>
    </li>
  </ul>
</template>
