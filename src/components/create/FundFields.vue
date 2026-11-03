<script setup lang="ts">
/** Fund a card from the multi-currency account: the amount that goes onto the card (in its currency), then which balance pays. */
import { computed } from "vue";
import CurrencyFlag from "@/components/CurrencyFlag.vue";
import CurrencySelect from "@/components/CurrencySelect.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import ForenTag from "@/components/ui/ForenTag.vue";
import { format, formatApproxRate, parseAmount } from "@/domain/money";
import { POLICY } from "@/config/policy";
import { feeScheduleText } from "@/domain/fees";
import { fundingCost } from "@/domain/routing";
import type { Balance, Currency } from "@/domain/types";

const props = defineProps<{
  currency: Currency;
  balances: Balance[];
  amountError?: string;
  fromError?: string;
}>();
const from = defineModel<Currency>("from", { required: true });
const fromModel = computed<Currency | undefined>({
  get: () => from.value,
  set: (c) => c && (from.value = c),
});
const amount = defineModel<string>("amount", { required: true });

const feeNote = feeScheduleText(POLICY.cardFundingFee, format);
const QUICK = [100, 500, 1000, 5000];
const parsed = computed(() => parseAmount(amount.value, props.currency));
const cost = computed(() =>
  parsed.value && parsed.value.minor > 0
    ? fundingCost(parsed.value, from.value)
    : null,
);
const isQuick = (n: number) => Number(amount.value.replace(/,/g, "")) === n;
</script>

<template>
  <div class="space-y-5">
    <div class="space-y-3">
      <ForenInput
        v-model="amount"
        :label="`Amount to add (${currency})`"
        placeholder="0.00"
        inputmode="decimal"
        class="tnum"
        :error="amountError"
      >
        <template #leadingIcon>
          <span
            class="flex items-center gap-1.5 text-[14px] font-medium text-fg-2"
            ><CurrencyFlag :currency="currency" :size="18" />{{
              currency
            }}</span
          >
        </template>
      </ForenInput>
      <div
        class="flex flex-wrap gap-2"
        role="group"
        aria-label="Suggested amounts"
      >
        <ForenTag
          v-for="n in QUICK"
          :key="n"
          size="xs"
          type="button"
          :selected="isQuick(n)"
          :aria-pressed="isQuick(n)"
          @click="amount = String(n)"
        >
          {{ n.toLocaleString("en-US") }}
        </ForenTag>
      </div>
    </div>

    <div>
      <CurrencySelect
        v-model="fromModel"
        label="Fund from"
        :options="
          balances.filter((b) => b.available.minor > 0).map((b) => b.currency)
        "
        :balances="balances"
      />
      <p v-if="fromError" role="alert" class="mt-1 text-[12px] text-error">
        {{ fromError }}
      </p>
    </div>

    <dl
      v-if="cost && parsed"
      class="divide-y divide-line rounded-[14px] bg-subtle px-3.5 text-[13px]"
      aria-live="polite"
    >
      <div class="flex justify-between gap-4 py-2">
        <dt class="text-fg-2">Card receives</dt>
        <dd class="tnum font-medium text-fg">{{ format(parsed) }}</dd>
      </div>
      <div class="flex justify-between gap-4 py-2" data-testid="funding-fee">
        <dt class="text-fg-2">
          Funding fee
          <span class="block text-[11px] text-fg-3">{{ feeNote }}</span>
        </dt>
        <dd class="tnum font-medium text-fg">{{ format(cost.cardFee) }}</dd>
      </div>
      <div v-if="cost.fx" class="flex justify-between gap-4 py-2">
        <dt class="text-fg-2">Exchange rate</dt>
        <dd class="tnum font-medium text-fg">
          {{ formatApproxRate(currency, from) }}
        </dd>
      </div>
      <div v-if="cost.fx" class="flex justify-between gap-4 py-2">
        <dt class="text-fg-2">Conversion fee</dt>
        <dd class="tnum font-medium text-fg">{{ format(cost.fee) }}</dd>
      </div>
      <div class="flex justify-between gap-4 py-2">
        <dt class="font-medium text-fg">You pay</dt>
        <dd class="tnum font-semibold text-fg">{{ format(cost.debit) }}</dd>
      </div>
    </dl>
  </div>
</template>
