<script setup lang="ts">
import { computed } from "vue";
import { RiCheckLine, RiErrorWarningLine } from "@/components/icons";
import { format } from "@/domain/money";
import type { Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import type { TravelPlan } from "./travel-insights";

const props = defineProps<{ card: Card; plan: TravelPlan }>();

const items = computed(() => {
  const { card, plan } = props;
  const ok = plan.decision.approved;
  const items: { good: boolean; text: string }[] = [
    card.status === "active" ? { good: true, text: "The card is active" } : { good: false, text: card.status === "frozen" ? "The card is frozen" : "The card has been canceled" },
    plan.left ? { good: plan.left.minor > 0, text: `${format(plan.left)} left on the limit this period` } : { good: true, text: "No spending limit beyond your balances" },
  ];
  if (card.activeFrom || card.activeUntil) items.push({ good: true, text: `Only works ${card.activeFrom ?? "now"} to ${card.activeUntil ?? "no end"}` });
  if (card.lockedMerchantId) items.push({ good: false, text: `Locked to ${merchantById(card.lockedMerchantId)?.name}` });
  const why = !ok ? plan.decision.reason : undefined;
  if (why === "spend_limit" || why === "per_charge_limit") items.push({ good: false, text: `A ${format(plan.sample)} charge would go over the card’s limit` });
  else if (why === "card_control") items.push({ good: false, text: "Payments in other currencies are turned off in Card controls" });
  else if (why === "outside_period") items.push({ good: false, text: "Today is outside the card’s spending period" });
  else if (why === "insufficient_balance") items.push({ good: false, text: "Balances can’t cover a typical charge" });
  else if ((why === "category_blocked" || why === "merchant_not_allowed") && !card.lockedMerchantId) items.push({ good: false, text: "Card rules don’t allow travel spending" });
  return items;
});
</script>

<template>
  <ul class="space-y-2 text-[14px] leading-[20px]">
    <li v-for="i in items" :key="i.text" class="flex gap-2.5">
      <RiCheckLine v-if="i.good" class="mt-0.5 size-[18px] shrink-0 text-success" aria-hidden="true" />
      <RiErrorWarningLine v-else class="mt-0.5 size-[18px] shrink-0 text-warning" aria-hidden="true" />
      <span class="text-fg">{{ i.text }}</span>
    </li>
  </ul>
</template>
