<script setup lang="ts">
/** The two spending limits every card has: a daily limit and a per-transaction limit (never above the daily one). */
import CurrencyFlag from "@/components/CurrencyFlag.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import type { LimitErrors } from "@/domain/limits";
import type { Currency } from "@/domain/types";

defineProps<{ currency: Currency; errors?: LimitErrors; idPrefix?: string }>();
const daily = defineModel<string>("daily", { required: true });
const txn = defineModel<string>("txn", { required: true });
</script>

<template>
  <div class="space-y-5">
    <ForenInput
      v-model="daily"
      inputmode="decimal"
      class="tnum"
      :error="errors?.daily"
    >
      <template #label
        >Daily limit<span
          class="block text-[12px] leading-[16px] font-normal text-fg-3"
          >Most it can spend in a day</span
        ></template
      >
      <template #leadingIcon>
        <span
          class="flex items-center gap-1.5 text-[14px] font-medium text-fg-2"
          ><CurrencyFlag :currency="currency" :size="18" />{{ currency }}</span
        >
      </template>
    </ForenInput>
    <ForenInput
      v-model="txn"
      inputmode="decimal"
      class="tnum"
      :error="errors?.txn"
    >
      <template #label
        >Transaction limit<span
          class="block text-[12px] leading-[16px] font-normal text-fg-3"
          >Most it can spend on one payment</span
        ></template
      >
      <template #leadingIcon>
        <span
          class="flex items-center gap-1.5 text-[14px] font-medium text-fg-2"
          ><CurrencyFlag :currency="currency" :size="18" />{{ currency }}</span
        >
      </template>
    </ForenInput>
  </div>
</template>
