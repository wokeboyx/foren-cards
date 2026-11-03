<script setup lang="ts">
/** What a card is allowed and what it costs: how many cards, the limits, and the creation, funding and withdrawal fees. All values come from POLICY. */
import { POLICY } from "@/config/policy";
import { feeScheduleText } from "@/domain/fees";
import { format } from "@/domain/money";

defineProps<{ title?: string }>();

const max = format({
  minor: POLICY.maxLimitMajor.USD * 100,
  currency: "USD",
});
const rows = [
  {
    label: "Cards you can have",
    value: `Up to ${POLICY.maxActiveCards} active cards at a time`,
  },
  { label: "Daily limit", value: `Up to ${max} a day on each card` },
  {
    label: "Limit per transaction",
    value: `Up to ${max}, and never above the card’s daily limit`,
  },
  {
    label: "Card creation fee",
    value: `${format(POLICY.cardCreationFee)} for each new card`,
  },
  {
    label: "Funding fee",
    value: feeScheduleText(POLICY.cardFundingFee, format),
  },
  {
    label: "Withdrawal fee",
    value: feeScheduleText(POLICY.cardWithdrawalFee, format),
  },
];
</script>

<template>
  <section
    aria-label="Card limits and fees"
    class="rounded-[20px] bg-surface p-4 ring-1 ring-line"
  >
    <h3 class="text-[14px] leading-[21px] font-semibold text-fg">
      {{ title ?? "Limits and fees" }}
    </h3>
    <dl class="mt-2 divide-y divide-line text-[13px] leading-[19px]">
      <div
        v-for="r in rows"
        :key="r.label"
        class="flex items-start justify-between gap-4 py-2"
      >
        <dt class="shrink-0 text-fg-3">{{ r.label }}</dt>
        <dd class="text-right text-fg">{{ r.value }}</dd>
      </div>
    </dl>
  </section>
</template>
