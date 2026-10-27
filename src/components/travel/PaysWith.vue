<script setup lang="ts">
import { computed } from "vue";
import FundingLegs from "@/components/FundingLegs.vue";
import Money from "@/components/Money.vue";
import { format } from "@/domain/money";
import type { Currency } from "@/domain/types";
import type { TravelPlan } from "./travel-insights";

const props = defineProps<{ plan: TravelPlan; local: Currency }>();
const legs = computed(() => (props.plan.route.ok ? props.plan.route.legs : []));
</script>

<template>
  <div class="space-y-3">
    <p class="text-[14px] leading-[21px] text-fg-2">
      <template v-if="plan.held && plan.held.minor >= plan.sample.minor">
        You hold <Money :value="plan.held" class="tnum font-semibold text-fg" /> in {{ local }}. No conversion needed.
      </template>
      <template v-else-if="plan.held && plan.held.minor > 0">
        You hold <Money :value="plan.held" class="tnum font-semibold text-fg" /> in {{ local }}. It’s used first; the rest is converted at the lowest cost.
      </template>
      <template v-else>You don’t hold {{ local }}. Charges are converted at the lowest cost.</template>
    </p>
    <template v-if="plan.route.ok">
      <p class="text-[13px] font-medium text-fg">A {{ format(plan.sample) }} charge would be paid like this:</p>
      <FundingLegs :legs="legs" :fee-avoided="plan.route.feeAvoided" />
    </template>
    <p v-else class="rounded-[14px] bg-warning-subtle px-3.5 py-2.5 text-[13px] text-fg">Balances can’t cover a {{ format(plan.sample) }} charge.</p>
  </div>
</template>
