<script setup lang="ts">
import { computed } from "vue";
import { STRATEGY, strategyLabel } from "@/domain/labels";
import { CURRENCY_NAME } from "@/domain/money";
import type { FundingConfig } from "@/domain/types";

/** The funding path as a short ordered list: card balances → other balances (AC 2.3, 4.1). Cards only pay from Foren balances. */
const props = defineProps<{ funding: FundingConfig }>();

const steps = computed(() => {
  const f = props.funding;
  const out: { title: string; detail: string }[] = [];
  if (f.strategy === "custom") {
    f.order.forEach((c, i) => out.push({ title: `${c} balance`, detail: i === 0 ? "Tried first" : CURRENCY_NAME[c] }));
  } else if (f.strategy === "cheapest_fx") {
    out.push({ title: "Balance in the charge’s currency", detail: "Used first, so no conversion is needed" });
    out.push({ title: "Other eligible balances", detail: `Eligible: ${f.order.join(", ")}. The cheapest to convert is tried first, and one charge may be split.` });
  } else {
    out.push({ title: "Balance in the charge’s currency", detail: "Used first, so no conversion is needed" });
    const kept = f.protect ?? "USD";
    out.push({ title: `Other balances except ${kept}`, detail: f.order.filter((c) => c !== kept).join(", ") });
    out.push({ title: `${kept} balance (protected)`, detail: "Only if nothing else can cover the charge" });
  }
  return out;
});
</script>

<template>
  <div>
    <div class="mb-2 text-[13px] text-fg-2">
      <span class="font-semibold text-fg">{{ strategyLabel(funding) }}</span> · {{ STRATEGY[funding.strategy].line }}
    </div>
    <ol class="relative space-y-0">
      <li v-for="(s, i) in steps" :key="i" class="relative flex gap-3 pb-3 last:pb-0">
        <span v-if="i < steps.length - 1" aria-hidden="true" class="absolute top-6 bottom-0 left-[11px] w-px bg-line-2" />
        <span class="tnum relative z-10 grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-[12px] font-semibold text-fg-2 ring-2 ring-surface">
          {{ i + 1 }}
        </span>
        <div class="min-w-0 pt-0.5">
          <div class="text-[14px] leading-[20px] font-medium text-fg">{{ s.title }}</div>
          <div class="text-[12px] leading-[16px] text-fg-3">{{ s.detail }}</div>
        </div>
      </li>
    </ol>
  </div>
</template>
