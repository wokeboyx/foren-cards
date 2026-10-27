<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { RiFileList3Line } from "@/components/icons";
import NotFound from "@/components/create/NotFound.vue";
import EmptyState from "@/components/EmptyState.vue";
import ErrorState from "@/components/ErrorState.vue";
import LoadingRows from "@/components/LoadingRows.vue";
import PageHeader from "@/components/PageHeader.vue";
import Panel from "@/components/Panel.vue";
import Sheet from "@/components/Sheet.vue";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import ForenTable from "@/components/ui/ForenTable.vue";
import ForenTableBody from "@/components/ui/ForenTableBody.vue";
import ForenTableHead from "@/components/ui/ForenTableHead.vue";
import ForenTableHeaderCell from "@/components/ui/ForenTableHeaderCell.vue";
import { useLoad } from "@/composables/useLoad";
import { COPY } from "@/content/copy";
import { merchantById } from "@/fixtures/merchants";
import { visibleCards } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";
import MonthlyStatement from "./MonthlyStatement.vue";
import TransactionDetail from "./TransactionDetail.vue";
import { dt, needsReceipt } from "./transactions-page";
import TxRow from "./TxRow.vue";

const props = defineProps<{ cardId: string }>();
const store = useAppStore();
const route = useRoute();
const router = useRouter();
const card = computed(() => visibleCards(store.role, store.cards).find((c) => c.id === props.cardId));
const { status, retry } = useLoad(() => `tx-${props.cardId}`);
const openId = computed(() => {
  const v = route.query.tx;
  return (Array.isArray(v) ? v[0] : v) ?? null;
});
const showFilter = ref<"all" | "receipts">("all");
const txns = computed(() => (card.value ? store.transactions.filter((t) => t.cardId === card.value!.id) : []));
const shown = computed(() => (showFilter.value === "receipts" ? txns.value.filter(needsReceipt) : txns.value));
const open = computed(() => txns.value.find((t) => t.id === openId.value));
const setOpen = (id: string | null) => router.replace({ path: route.path, query: id ? { tx: id } : {} });
</script>

<template>
  <NotFound v-if="!card" />
  <div v-else class="space-y-3">
    <PageHeader title="Transactions" :description="`${card.nickname} •• ${card.last4}`" />

    <MonthlyStatement v-if="status === 'ready' && txns.length > 0" :card="card" :txns="txns" />

    <div class="flex flex-wrap items-center gap-2">
      <ForenSegmentedControl
        v-model="showFilter"
        size="lg"
        aria-label="Show"
        :options="[
          { value: 'all', label: 'All' },
          { value: 'receipts', label: `Missing receipts · ${txns.filter(needsReceipt).length}` },
        ]"
      />
    </div>

    <Panel class="px-6 py-4">
      <LoadingRows v-if="status === 'loading'" :rows="6" />
      <ErrorState v-if="status === 'error'" @retry="retry" />
      <EmptyState v-if="status === 'ready' && txns.length === 0" :title="COPY.transactionsEmpty.title" :body="COPY.transactionsEmpty.body">
        <template #icon><RiFileList3Line /></template>
      </EmptyState>
      <EmptyState v-if="status === 'ready' && txns.length > 0 && shown.length === 0" title="Nothing missing" body="Every approved charge on this card has a receipt.">
        <template #icon><RiFileList3Line /></template>
      </EmptyState>
      <ForenTable v-if="status === 'ready' && shown.length > 0" class="table-flush" :caption="`Transactions on ${card.nickname}`" :min-width="0">
        <ForenTableHead>
          <tr>
            <ForenTableHeaderCell label="Description" />
            <ForenTableHeaderCell label="Date" class="hidden sm:table-cell" />
            <ForenTableHeaderCell label="Status" class="hidden sm:table-cell" />
            <ForenTableHeaderCell label="Amount" align="right" />
          </tr>
        </ForenTableHead>
        <ForenTableBody>
          <TxRow v-for="(t, i) in shown" :key="t.id" :t="t" :selected="t.id === openId" :last="i === shown.length - 1" @open="setOpen(t.id)" />
        </ForenTableBody>
      </ForenTable>
    </Panel>

    <Sheet
      :open="!!open"
      :title="open ? (merchantById(open.merchantId)?.name ?? 'Transaction') : ''"
      :description="open ? dt(open.at) : undefined"
      @update:open="(o) => !o && setOpen(null)"
    >
      <TransactionDetail v-if="open" :t="open" :card="card" />
    </Sheet>
  </div>
</template>
