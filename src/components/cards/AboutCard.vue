<script setup lang="ts">
import { computed } from "vue";
import type { Card } from "@/domain/types";
import { personById } from "@/stores/app";

const props = defineProps<{ card: Card }>();
const rows = computed<[string, string | undefined][]>(() => {
  const c = props.card;
  return [
    c.companyCard ? ["Used by", (c.contactIds ?? [c.holderId]).map((id) => personById(id)?.name).join(", ")] : ["Cardholder", personById(c.holderId)?.name],
    ["Type", c.companyCard ? "Company card · virtual" : "Virtual card"],
    ["Created", new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })],
    ["Expires", `${c.expiry.slice(5)}/${c.expiry.slice(0, 4)}`],
    ["Billing address", `${c.billingAddress.line1}, ${c.billingAddress.city} ${c.billingAddress.postcode}`],
    ...(c.wallets?.length ? ([["Mobile wallets", c.wallets.map((w) => (w === "apple" ? "Apple Pay" : "Google Pay")).join(", ")]] as [string, string][]) : []),
  ];
});
</script>

<template>
  <section aria-labelledby="about-title" class="pt-7">
    <h2 id="about-title" class="mb-2 text-[20px] leading-[28px] font-semibold text-fg">About this card</h2>
    <dl class="divide-y divide-line rounded-[20px] bg-surface px-4">
      <div v-for="[k, v] in rows" :key="k" class="flex items-start justify-between gap-4 py-3 text-[14px]">
        <dt class="shrink-0 text-fg-2">{{ k }}</dt>
        <dd class="text-right text-fg">
          <span v-if="k === 'Billing address'" class="block max-w-[190px]">{{ v }}</span>
          <template v-else>{{ v }}</template>
        </dd>
      </div>
    </dl>
  </section>
</template>
