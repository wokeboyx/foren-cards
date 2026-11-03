<script setup lang="ts">
/** Beside the form, under the card preview: everything chosen so far (who, name, limits), and what it costs. Fills in as the form does. */
import { computed } from "vue";
import { nameOnCard } from "@/components/card/holder";
import { format, formatApproxRate } from "@/domain/money";
import type { Card, Currency, Money } from "@/domain/types";
import SummaryRow from "./SummaryRow.vue";

const props = defineProps<{
  card: Card;
  /** Parsed from what's typed; null while it isn't a valid amount. */
  daily: Money | null;
  txn: Money | null;
  fee: Money;
  from: Currency;
  /** The fee in the card-fee currency, when it was converted. */ original?: Money;
}>();

const holder = computed(() => nameOnCard(props.card));
const show = (m: Money | null) => (m ? format(m) : "—");
</script>

<template>
  <dl
    class="summary-in w-full divide-y divide-line rounded-[20px] bg-surface px-4 text-[13px] ring-1 ring-line"
    aria-label="Card details so far"
  >
    <SummaryRow label="Name">
      <span :class="!card.nickname.trim() && 'text-fg-3'">{{
        card.nickname.trim() || "Not named yet"
      }}</span>
    </SummaryRow>
    <SummaryRow label="For">
      <span :class="!holder && 'text-fg-3'">{{
        holder ?? "Not chosen yet"
      }}</span>
    </SummaryRow>
    <SummaryRow label="Daily limit">{{ show(daily) }}</SummaryRow>
    <SummaryRow label="Per transaction">{{ show(txn) }}</SummaryRow>
    <!-- Amount on the label's row, right-aligned; where it's paid from stays left, underneath -->
    <div class="grid grid-cols-[1fr_auto] items-start gap-x-4 py-2.5">
      <dt class="text-fg-3">Creation fee</dt>
      <dd class="tnum text-right text-fg">{{ format(fee) }}</dd>
      <dd class="col-span-2 mt-1 text-left text-[12px] text-fg-3">
        Paid from your {{ from }} balance<template v-if="original">
          ({{ format(original) }} converted)</template
        >
      </dd>
      <dd
        v-if="original"
        class="col-span-2 text-left text-[12px] text-fg-3"
        data-testid="creation-fee-rate"
      >
        Exchange rate {{ formatApproxRate(original.currency, from) }}
      </dd>
    </div>
  </dl>
</template>

<style scoped>
.summary-in {
  animation: summary-in 0.25s ease both;
}
@keyframes summary-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .summary-in {
    animation: none;
  }
}
</style>
