<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { RiFileList3Line, RiSearchLine } from "@/components/icons";
import EmptyState from "@/components/EmptyState.vue";
import ErrorState from "@/components/ErrorState.vue";
import LoadingRows from "@/components/LoadingRows.vue";
import Sheet from "@/components/Sheet.vue";
import ForenSelect from "@/components/ui/ForenSelect.vue";
import ForenTable from "@/components/ui/ForenTable.vue";
import ForenTableBody from "@/components/ui/ForenTableBody.vue";
import ForenTableHead from "@/components/ui/ForenTableHead.vue";
import ForenTableHeaderCell from "@/components/ui/ForenTableHeaderCell.vue";
import ForenTablePagination from "@/components/ui/ForenTablePagination.vue";
import { useLoad } from "@/composables/useLoad";
import { COPY } from "@/content/copy";
import { merchantById } from "@/fixtures/merchants";
import type { Card } from "@/domain/types";
import { useAppStore } from "@/stores/app";
import TransactionDetail from "@/components/transactions/TransactionDetail.vue";
import {
  dt,
  needsReceipt,
  txRef,
  txType,
} from "@/components/transactions/transactions-page";
import TxRow from "@/components/transactions/TxRow.vue";

const props = defineProps<{ card: Card }>();
const store = useAppStore();
const route = useRoute();
const router = useRouter();
const card = computed(() => props.card);
const { status, retry } = useLoad(() => `tx-${props.card.id}`);
const openId = computed(() => {
  const v = route.query.tx;
  return (Array.isArray(v) ? v[0] : v) ?? null;
});
const txns = computed(() =>
  card.value
    ? store.transactions.filter((t) => t.cardId === card.value!.id)
    : [],
);
const query = ref("");
const typeFilter = ref<"all" | "Debit" | "Credit">("all");
/** One filter for status and receipts: everything, charges still missing a receipt, or a status. */
const statusFilter = ref<
  | "all"
  | "missing"
  | "funded"
  | "approved"
  | "pending"
  | "declined"
  | "refunded"
>("all");
const PAGE_SIZE = 8;
const page = ref(1);
const matching = computed(() => {
  const q = query.value.trim().toLowerCase();
  return txns.value.filter(
    (t) =>
      (typeFilter.value === "all" || txType(t).label === typeFilter.value) &&
      (statusFilter.value === "all" ||
        (statusFilter.value === "missing"
          ? needsReceipt(t)
          : statusFilter.value === "funded"
            ? t.kind === "funding"
            : t.kind !== "funding" && t.status === statusFilter.value)) &&
      (!q ||
        (t.kind === "funding"
          ? "card funded"
          : (merchantById(t.merchantId)?.name ?? "").toLowerCase()
        ).includes(q) ||
        txRef(t).toLowerCase().includes(q)),
  );
});
const pageCount = computed(() =>
  Math.max(1, Math.ceil(matching.value.length / PAGE_SIZE)),
);
const shown = computed(() =>
  matching.value.slice(
    (Math.min(page.value, pageCount.value) - 1) * PAGE_SIZE,
    Math.min(page.value, pageCount.value) * PAGE_SIZE,
  ),
);
const typeOptions = [
  { value: "all", label: "All type" },
  { value: "Debit", label: "Debit" },
  { value: "Credit", label: "Credit" },
];
const statusOptions = computed(() => [
  { value: "all", label: "All status" },
  {
    value: "missing",
    label: `Missing receipts · ${txns.value.filter(needsReceipt).length}`,
  },
  { value: "funded", label: "Funded" },
  { value: "approved", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "declined", label: "Declined" },
  { value: "refunded", label: "Refunded" },
]);
const open = computed(() => txns.value.find((t) => t.id === openId.value));
const setOpen = (id: string | null) => {
  const query = { ...route.query };
  if (id) query.tx = id;
  else delete query.tx;
  router.replace({ path: route.path, query });
};
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <label class="relative min-w-[220px] flex-1 sm:max-w-[320px]">
        <span class="sr-only">Search name or reference</span>
        <RiSearchLine
          class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-3"
          aria-hidden="true"
        />
        <input
          v-model="query"
          type="search"
          placeholder="Search name, reference"
          class="h-10 w-full rounded-full bg-subtle pr-3.5 pl-10 text-[13px] text-fg outline-none placeholder:text-fg-3 focus:ring-2 focus:ring-focus"
          @input="page = 1"
        />
      </label>
      <ForenSelect
        v-model="typeFilter"
        size="xs"
        aria-label="Type"
        :options="typeOptions"
        @update:model-value="page = 1"
      />
      <ForenSelect
        v-model="statusFilter"
        size="xs"
        aria-label="Status"
        :options="statusOptions"
        @update:model-value="page = 1"
      />
    </div>

    <div>
      <LoadingRows v-if="status === 'loading'" :rows="6" />
      <ErrorState v-if="status === 'error'" @retry="retry" />
      <EmptyState
        v-if="status === 'ready' && txns.length === 0"
        :title="COPY.transactionsEmpty.title"
        :body="COPY.transactionsEmpty.body"
      >
        <template #icon><RiFileList3Line /></template>
      </EmptyState>
      <EmptyState
        v-if="status === 'ready' && txns.length > 0 && shown.length === 0"
        title="Nothing matches"
        body="Try a different search or filter."
      >
        <template #icon><RiFileList3Line /></template>
      </EmptyState>
      <ForenTable
        v-if="status === 'ready' && shown.length > 0"
        class="table-flush"
        :caption="`Transactions on ${card.nickname}`"
        :min-width="0"
      >
        <ForenTableHead>
          <tr>
            <ForenTableHeaderCell
              label="Date and time"
              class="hidden sm:table-cell"
            />
            <ForenTableHeaderCell label="Description" />
            <ForenTableHeaderCell
              label="Source"
              class="hidden min-[1800px]:table-cell"
            />
            <ForenTableHeaderCell
              label="Notes"
              class="hidden min-[1800px]:table-cell"
            />
            <ForenTableHeaderCell label="Amount" align="right" />
            <ForenTableHeaderCell label="Status" class="hidden sm:table-cell" />
          </tr>
        </ForenTableHead>
        <ForenTableBody>
          <TxRow
            compact
            v-for="(t, i) in shown"
            :key="t.id"
            :t="t"
            :selected="t.id === openId"
            :last="i === shown.length - 1"
            @open="setOpen(t.id)"
          />
        </ForenTableBody>
      </ForenTable>
      <ForenTablePagination
        v-if="status === 'ready' && pageCount > 1"
        layout="desktop"
        size="sm"
        class="mt-4 justify-center"
        :page="Math.min(page, pageCount)"
        :page-count="pageCount"
        @update:page="(p) => (page = p)"
      />
    </div>

    <Sheet
      :open="!!open"
      :title="
        open ? (merchantById(open.merchantId)?.name ?? 'Transaction') : ''
      "
      :description="open ? dt(open.at) : undefined"
      @update:open="(o) => !o && setOpen(null)"
    >
      <TransactionDetail v-if="open" :t="open" :card="card" />
    </Sheet>
  </div>
</template>
