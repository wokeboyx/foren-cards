<script setup lang="ts">
import { computed } from "vue";
import Money from "@/components/Money.vue";
import ForenTableCell from "@/components/ui/ForenTableCell.vue";
import ForenTableRow from "@/components/ui/ForenTableRow.vue";
import type { Transaction } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { cn } from "@/lib/utils";
import { dt, txStatus } from "./transactions-page";

const props = defineProps<{ t: Transaction; selected?: boolean; last?: boolean }>();
const emit = defineEmits<{ open: [] }>();
const m = computed(() => merchantById(props.t.merchantId));
const st = computed(() => txStatus(props.t));
const description = computed(() => {
  const t = props.t;
  return t.status === "declined" ? "Not charged" : t.legs.length > 1 ? "Split across balances" : t.legs.some((l) => l.fx) ? "Converted" : `${t.legs[0]?.source.currency ?? ""} balance`;
});
</script>

<template>
  <ForenTableRow :selected="selected" :last="last" @click="emit('open')">
    <ForenTableCell :avatar="{ initials: m?.mark, name: m?.name }" :description="description">
      <template #label>
        <button type="button" class="outline-none focus-visible:underline" @click.stop="emit('open')">{{ m?.name }}</button>
      </template>
    </ForenTableCell>
    <ForenTableCell :label="dt(t.at)" class="hidden sm:table-cell" />
    <ForenTableCell type="badge" :label="st.label" :color="st.color" class="hidden sm:table-cell" />
    <ForenTableCell align="right">
      <template #label><Money :value="t.amount" :class="cn(t.status === 'declined' && 'text-fg-3 line-through')" /></template>
    </ForenTableCell>
  </ForenTableRow>
</template>
