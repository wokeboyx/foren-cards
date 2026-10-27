<script setup lang="ts">
import { cn } from "@/lib/utils";
import { CALCULATOR } from "./data";
import CurrencyPill from "./CurrencyPill.vue";
import Panel from "./Panel.vue";
import { muted } from "./shared";

defineProps<{ label: string }>();
const currency = defineModel<string>("currency", { required: true });
</script>

<template>
  <Panel class="flex items-end gap-2 py-2 pr-6 pl-2">
    <div class="flex flex-1 flex-col gap-1">
      <p :class="cn('px-2 py-1 text-[12px] font-medium tracking-[0.12px]', muted)">{{ label }}</p>
      <div>
        <CurrencyPill v-model="currency" :label="`${label} currency`" :options="CALCULATOR" />
      </div>
    </div>
    <div class="flex-1 pb-1"><slot /></div>
  </Panel>
</template>
