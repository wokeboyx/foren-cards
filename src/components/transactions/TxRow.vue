<script setup lang="ts">
import { computed } from "vue";
import Money from "@/components/Money.vue";
import ForenTableCell from "@/components/ui/ForenTableCell.vue";
import ForenTableRow from "@/components/ui/ForenTableRow.vue";
import type { Transaction } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { DECLINE } from "@/content/copy";
import { cn } from "@/lib/utils";
import { dt, txRef, txStatus, txType } from "./transactions-page";

const props = defineProps<{
  t: Transaction;
  selected?: boolean;
  last?: boolean;
  /** Beside the card panel there is little width: the table shows Source and Notes only on very wide screens. */
  compact?: boolean;
}>();
const emit = defineEmits<{ open: [] }>();
const m = computed(() => merchantById(props.t.merchantId));
/** Money added to the card: it's in the history, but it isn't a payment, so there's no detail to open. */
const funding = computed(() => props.t.kind === "funding");
const st = computed(() => txStatus(props.t));
const type = computed(() => txType(props.t));
/** Compact (card page) table: where the money came from, and a note in words, like VaultDesk's Source(s) and Notes. */
const source = computed(() =>
  funding.value
    ? `${props.t.fundedFrom} balance`
    : props.t.status === "declined"
      ? "Not charged"
      : props.t.legs.some((l) => l.fx)
        ? "Converted"
        : "Card balance",
);
const note = computed(() => {
  const t = props.t;
  if (funding.value) return "Added to the card balance.";
  if (t.status === "declined")
    return t.declineReason ? DECLINE[t.declineReason].title : "Declined.";
  if (t.status === "refunded") return "Refunded to the card balance.";
  if (t.status === "pending") return "Waiting for the merchant to settle.";
  return t.legs.some((l) => l.fx)
    ? "Converted from another balance."
    : "Paid from the card balance.";
});
const description = computed(() => {
  const t = props.t;
  if (props.compact) return undefined; // Source and Notes say it
  if (funding.value) return `From your ${t.fundedFrom} balance`;
  return t.status === "declined"
    ? "Not charged"
    : t.legs.some((l) => l.fx)
      ? "Converted from card balance"
      : "Paid from card balance";
});
</script>

<template>
  <ForenTableRow :selected="selected" :last="last" @click="emit('open')">
    <ForenTableCell
      v-if="!compact"
      :label="txRef(t)"
      :class="'hidden font-mono text-[13px] lg:table-cell'"
    />
    <ForenTableCell :label="dt(t.at)" class="hidden sm:table-cell" />
    <ForenTableCell
      :avatar="funding ? undefined : { initials: m?.mark, name: m?.name }"
      :description="description"
    >
      <template #label>
        <button
          type="button"
          class="outline-none focus-visible:underline"
          @click.stop="emit('open')"
        >
          {{ funding ? "Card funded" : m?.name }}
        </button>
      </template>
    </ForenTableCell>
    <ForenTableCell
      v-if="!compact"
      type="badge"
      :label="type.label"
      :color="type.color"
      class="hidden sm:table-cell"
    />
    <ForenTableCell
      v-if="compact"
      type="badge"
      :label="source"
      color="gray"
      class="hidden min-[1800px]:table-cell"
    />
    <ForenTableCell
      v-if="compact"
      :label="note"
      class="hidden max-w-[220px] text-[13px] text-fg-2 min-[1800px]:table-cell"
    />
    <ForenTableCell align="right">
      <template #label
        ><Money
          :value="t.amount"
          :sign="t.status === 'refunded' || funding ? '+' : undefined"
          :class="cn(t.status === 'declined' && 'text-fg-3 line-through')"
      /></template>
    </ForenTableCell>
    <ForenTableCell
      type="badge"
      :label="st.label"
      :color="st.color"
      class="hidden sm:table-cell"
    />
  </ForenTableRow>
</template>
