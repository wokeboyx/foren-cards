<script setup lang="ts">
import { computed } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import FundingPath from "@/components/card/FundingPath.vue";
import CurrencySelect from "@/components/CurrencySelect.vue";
import { STRATEGY } from "@/domain/labels";
import { convert } from "@/domain/money";
import type { Currency, FundingConfig, FundingStrategy } from "@/domain/types";
import { useAppStore } from "@/stores/app";
import ChoiceCard from "./ChoiceCard.vue";
import FundingOrderRow from "./FundingOrderRow.vue";

const model = defineModel<FundingConfig>({ required: true });
const store = useAppStore();

const set = (patch: Partial<FundingConfig>) => (model.value = { ...model.value, ...patch });
const arrayMove = <T,>(arr: T[], from: number, to: number) => {
  const out = [...arr];
  out.splice(to, 0, ...out.splice(from, 1));
  return out;
};
const move = (i: number, dir: -1 | 1) => {
  const j = i + dir;
  if (j < 0 || j >= model.value.order.length) return;
  set({ order: arrayMove(model.value.order, i, j) });
};
// Suggest protecting the largest balance; the user can pick any currency.
const largestBalance = (): Currency =>
  [...store.balances].sort((a, b) => convert(b.available, "USD").minor - convert(a.available, "USD").minor)[0]?.currency ?? model.value.order[0];

const strategies = Object.keys(STRATEGY) as FundingStrategy[];
const pickStrategy = (v: string) =>
  set({ strategy: v as FundingStrategy, ...(v === "protect" && !model.value.protect ? { protect: largestBalance() } : {}) });

const order = computed({
  get: () => model.value.order,
  set: (o: Currency[]) => set({ order: o }),
});
</script>

<template>
  <div class="space-y-5">
    <fieldset>
      <legend class="mb-2 text-[14px] font-medium text-fg">Funding strategy</legend>
      <div class="grid gap-2">
        <ChoiceCard
          v-for="k in strategies"
          :key="k"
          name="strategy"
          :value="k"
          :checked="model.strategy === k"
          :title="STRATEGY[k].label"
          :description="STRATEGY[k].line"
          @change="pickStrategy"
        >
          <template v-if="k === 'cheapest_fx'" #badge><ForenBadge size="sm" color="success">Recommended</ForenBadge></template>
        </ChoiceCard>
      </div>
    </fieldset>

    <div v-if="model.strategy === 'protect'">
      <CurrencySelect
        label="Which currency do you want to protect?"
        :model-value="model.protect"
        :options="model.order"
        :balances="store.balances"
        @update:model-value="(c) => set({ protect: c })"
      />
      <p class="mt-2 text-[13px] leading-[18px] text-fg-2">Usually the one you hold for savings or to pay suppliers. Charges in that currency still use it first, so there’s no conversion.</p>
    </div>

    <div v-if="model.strategy === 'custom'">
      <div id="order-label" class="mb-2 text-[14px] font-medium text-fg">Balance order</div>
      <p class="mb-3 text-[13px] text-fg-2">Drag to reorder, or use the arrow buttons. Balances are tried from the top.</p>
      <VueDraggable v-model="order" tag="ol" handle="[data-drag-handle]" :animation="150" ghost-class="opacity-60" aria-labelledby="order-label" class="space-y-2">
        <FundingOrderRow
          v-for="(c, i) in order"
          :key="c"
          :id="c"
          :index="i"
          :total="order.length"
          :available="store.balances.find((b) => b.currency === c)?.available"
          @move="(d) => move(i, d)"
        />
      </VueDraggable>
    </div>

    <div>
      <div class="mb-2 text-[14px] font-medium text-fg">Where this card’s money will come from</div>
      <FundingPath :funding="model" class="rounded-[16px] border border-line p-4" />
    </div>
  </div>
</template>
