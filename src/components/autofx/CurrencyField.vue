<script setup lang="ts">
import { POLICY } from "@/config/policy";
import { CURRENCY_NAME } from "@/domain/money";
import type { Currency } from "@/domain/types";
import { cn } from "@/lib/utils";

defineProps<{ id: string; label: string; error?: string }>();
const model = defineModel<Currency>({ required: true });
</script>

<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-[14px] font-medium text-fg">{{ label }}</label>
    <select
      :id="id"
      v-model="model"
      :aria-invalid="!!error"
      :class="
        cn(
          'h-12 rounded-[16px] border bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus',
          error ? 'border-error' : 'border-transparent',
        )
      "
    >
      <option v-for="c in POLICY.launchCurrencies" :key="c" :value="c">
        {{ c }} — {{ CURRENCY_NAME[c] }}
      </option>
    </select>
    <p v-if="error" class="text-[12px] text-error">{{ error }}</p>
  </div>
</template>
