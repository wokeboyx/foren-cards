<script setup lang="ts">
import { RiExchangeLine, RiWallet3Line } from "@/components/icons";
import Money from "@/components/Money.vue";
import { formatRate } from "@/domain/money";
import type { FeeAvoided, FundingLeg } from "@/domain/types";

/** Which balance(s) paid, with every conversion and fee shown separately — never folded into a total (AC 6.1). */
const props = defineProps<{ legs: FundingLeg[]; feeAvoided?: FeeAvoided }>();
const split = () => props.legs.length > 1;
</script>

<template>
  <div class="space-y-3">
    <p v-if="split()" class="text-[13px] text-fg-2">This charge was split across {{ legs.length }} balances.</p>
    <ol class="space-y-2">
      <li v-for="(l, i) in legs" :key="i" class="rounded-[16px] border border-line p-3.5">
        <div class="flex items-start gap-3">
          <span class="grid size-8 shrink-0 place-items-center rounded-full bg-subtle text-fg-2 [&_svg]:size-4" aria-hidden="true">
            <RiExchangeLine v-if="l.fx" />
            <RiWallet3Line v-else />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-baseline justify-between gap-x-3">
              <span class="text-[14px] font-semibold text-fg">
                <span v-if="split()" class="tnum mr-1 text-fg-3">{{ i + 1 }}.</span>{{ `${l.source.currency} balance` }}
              </span>
              <Money :value="l.debit" code class="text-[14px] font-semibold text-fg" />
            </div>
            <div class="mt-0.5 text-[13px] text-fg-2">
              Covered <Money :value="l.covers" /> of the charge{{ !l.fx ? " with no conversion" : "" }}.
            </div>
            <dl v-if="l.fx" class="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-[12px] bg-sunken px-3 py-2 text-[13px]">
              <dt class="text-fg-3">Converted</dt>
              <dd class="tnum text-right text-fg">
                <Money :value="{ minor: l.debit.minor - l.fx.fee.minor, currency: l.fx.from }" /> → <Money :value="l.fx.converted" />
              </dd>
              <dt class="text-fg-3">Rate</dt>
              <dd class="tnum text-right text-fg">{{ formatRate(l.fx.from, l.fx.converted.currency, l.fx.rate) }}</dd>
              <dt class="text-fg-3">FX fee</dt>
              <dd class="tnum text-right font-medium text-fg"><Money :value="l.fx.fee" /></dd>
            </dl>
          </div>
        </div>
      </li>
    </ol>
    <div v-if="feeAvoided" class="rounded-[16px] bg-success-subtle px-3.5 py-3 text-[13px] leading-[18px] text-success">
      <span class="font-semibold"><Money :value="feeAvoided.amount" /> fee avoided</span>
      — paid from a same-currency balance. <span class="text-fg-2">{{ feeAvoided.basis }}</span>
    </div>
  </div>
</template>
