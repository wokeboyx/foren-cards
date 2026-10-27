<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import type { BadgeColor } from "@/components/ui/foren-badge";
import ForenTable from "@/components/ui/ForenTable.vue";
import ForenTableBody from "@/components/ui/ForenTableBody.vue";
import ForenTableCell from "@/components/ui/ForenTableCell.vue";
import ForenTableHead from "@/components/ui/ForenTableHead.vue";
import ForenTableHeaderCell from "@/components/ui/ForenTableHeaderCell.vue";
import ForenTableRow from "@/components/ui/ForenTableRow.vue";
import LinkButton from "@/components/LinkButton.vue";
import Money from "@/components/Money.vue";
import { COPY } from "@/content/copy";
import type { Card, Transaction } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app";

const props = defineProps<{ card: Card }>();
const router = useRouter();
const store = useAppStore();
const txns = computed(() => store.transactions.filter((t) => t.cardId === props.card.id));
const rows = computed(() => txns.value.slice(0, 6));

const TX_STATUS: Record<Transaction["status"], string> = { approved: "Paid", declined: "Declined", pending: "Pending", refunded: "Refunded" };
const TX_COLOR: Record<Transaction["status"], BadgeColor> = { approved: "success", declined: "error", pending: "orange", refunded: "gray" };
const href = (t: Transaction) => `/cards/${props.card.id}/transactions?tx=${t.id}`;
</script>

<template>
  <p v-if="txns.length === 0" class="rounded-[14px] bg-canvas px-4 py-6 text-center text-[13px] text-fg-3">
    <span class="block font-medium text-fg-2">{{ COPY.transactionsEmpty.title }}</span>
    {{ COPY.transactionsEmpty.body }}
  </p>
  <template v-else>
    <ForenTable class="table-flush" :caption="`Recent transactions on ${card.nickname}`" :min-width="0">
      <ForenTableHead>
        <tr>
          <ForenTableHeaderCell label="Description" />
          <ForenTableHeaderCell label="Status" class="hidden sm:table-cell" />
          <ForenTableHeaderCell label="Amount" align="right" />
        </tr>
      </ForenTableHead>
      <ForenTableBody>
        <ForenTableRow v-for="(t, i) in rows" :key="t.id" :last="i === rows.length - 1" @click="router.push(href(t))">
          <ForenTableCell
            :description="t.legs.some((l) => l.fx) ? 'Converted' : t.status === 'declined' ? 'Not charged' : 'No conversion'"
            :avatar="{ initials: merchantById(t.merchantId)?.mark, name: merchantById(t.merchantId)?.name }"
          >
            <template #label>
              <RouterLink :to="href(t)" class="outline-none focus-visible:underline" @click.stop>{{ merchantById(t.merchantId)?.name }}</RouterLink>
            </template>
          </ForenTableCell>
          <ForenTableCell type="badge" :label="TX_STATUS[t.status]" :color="TX_COLOR[t.status]" class="hidden sm:table-cell" />
          <ForenTableCell align="right" :description="new Date(t.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })">
            <template #label>
              <Money :value="t.amount" :sign="t.status === 'refunded' ? '+' : undefined" :class="cn(t.status === 'declined' && 'text-fg-3 line-through')" />
            </template>
          </ForenTableCell>
        </ForenTableRow>
      </ForenTableBody>
    </ForenTable>
    <LinkButton :href="`/cards/${card.id}/transactions`" variant="secondary" size="xxs" class="mt-3 w-full">View all transactions</LinkButton>
  </template>
</template>
