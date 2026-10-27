<script setup lang="ts">
/** This month on one card, by merchant, with a CSV export (Mercury statements). */
import { computed } from "vue";
import { RiDownloadLine } from "@/components/icons";
import { toast } from "vue-sonner";
import Money from "@/components/Money.vue";
import Panel from "@/components/Panel.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenTable from "@/components/ui/ForenTable.vue";
import ForenTableBody from "@/components/ui/ForenTableBody.vue";
import ForenTableCell from "@/components/ui/ForenTableCell.vue";
import ForenTableHead from "@/components/ui/ForenTableHead.vue";
import ForenTableHeaderCell from "@/components/ui/ForenTableHeaderCell.vue";
import ForenTableRow from "@/components/ui/ForenTableRow.vue";
import { format } from "@/domain/money";
import type { Card, Money as MoneyT, Transaction } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { EXPENSE } from "./transactions-page";

const props = defineProps<{ card: Card; txns: Transaction[] }>();
const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth(), 1);
const month = computed(() => props.txns.filter((t) => t.status === "approved" && new Date(t.at) >= start));
const byMerchant = computed(() => {
  const map = new Map<string, { count: number; total: MoneyT }>();
  for (const t of month.value) {
    const k = `${t.merchantId}|${t.amount.currency}`;
    const prev = map.get(k);
    map.set(k, { count: (prev?.count ?? 0) + 1, total: { minor: (prev?.total.minor ?? 0) + t.amount.minor, currency: t.amount.currency } });
  }
  return [...map].sort((a, b) => b[1].total.minor - a[1].total.minor);
});
const totals = computed(() => {
  const map = new Map<string, number>();
  for (const t of month.value) map.set(t.amount.currency, (map.get(t.amount.currency) ?? 0) + t.amount.minor);
  return map;
});
const missing = computed(() => month.value.filter((t) => !t.receipt).length);

function exportCsv() {
  const rows = [["Date", "Merchant", "Amount", "Currency", "Status", "Category", "Note", "Receipt"]];
  for (const t of props.txns)
    rows.push([
      new Date(t.at).toISOString().slice(0, 10),
      merchantById(t.merchantId)?.name ?? t.merchantId,
      (t.amount.minor / 100).toFixed(2),
      t.amount.currency,
      t.status,
      t.expenseCategory ? EXPENSE[t.expenseCategory] : "",
      t.note ?? "",
      t.receipt?.name ?? "",
    ]);
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${props.card.nickname.replace(/\W+/g, "-").toLowerCase()}-${props.card.last4}-transactions.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Statement downloaded");
}
</script>

<template>
  <Panel class="px-6 py-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-[14px] text-fg-2">{{ now.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) }} statement</h2>
        <p class="tnum mt-1 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg">
          {{ totals.size ? [...totals].map(([c, m]) => format({ minor: m, currency: c as MoneyT["currency"] })).join(" · ") : "Nothing spent yet" }}
        </p>
        <p class="mt-1 text-[13px] text-fg-3">
          {{ month.length }} {{ month.length === 1 ? "charge" : "charges" }}{{ missing ? ` · ${missing} missing ${missing === 1 ? "receipt" : "receipts"}` : "" }}
        </p>
      </div>
      <ForenButton size="xxs" variant="secondary" @click="exportCsv">
        <template #leadingIcon><RiDownloadLine /></template>
        Export CSV
      </ForenButton>
    </div>
    <ForenTable v-if="byMerchant.length > 0" caption="Spend by merchant this month" :min-width="0" class="table-flush mt-4">
      <ForenTableHead>
        <tr>
          <ForenTableHeaderCell label="Merchant" />
          <ForenTableHeaderCell label="Charges" align="right" class="hidden sm:table-cell" />
          <ForenTableHeaderCell label="Total" align="right" />
        </tr>
      </ForenTableHead>
      <ForenTableBody>
        <ForenTableRow v-for="([k, v], i) in byMerchant" :key="k" :last="i === byMerchant.length - 1">
          <ForenTableCell
            :avatar="{ initials: merchantById(k.split('|')[0])?.mark, name: merchantById(k.split('|')[0])?.name }"
            :label="merchantById(k.split('|')[0])?.name"
          />
          <ForenTableCell align="right" :label="String(v.count)" class="hidden sm:table-cell" />
          <ForenTableCell align="right">
            <template #label><Money :value="v.total" /></template>
          </ForenTableCell>
        </ForenTableRow>
      </ForenTableBody>
    </ForenTable>
  </Panel>
</template>
