<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";
import ForenTable from "@/components/ui/ForenTable.vue";
import ForenTableBody from "@/components/ui/ForenTableBody.vue";
import ForenTableCell from "@/components/ui/ForenTableCell.vue";
import ForenTableHead from "@/components/ui/ForenTableHead.vue";
import ForenTableHeaderCell from "@/components/ui/ForenTableHeaderCell.vue";
import ForenTableRow from "@/components/ui/ForenTableRow.vue";
import Money from "@/components/Money.vue";
import { COPY } from "@/content/copy";
import { forecast } from "@/domain/forecast";
import type { Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { useNow } from "@/composables/useNow";
import { useAppStore } from "@/stores/app";

const props = defineProps<{ card: Card }>();
const router = useRouter();
const store = useAppStore();
const now = useNow(60_000);
const subs = computed(() =>
  store.subscriptions.filter((s) => s.cardId === props.card.id).map((s) => ({ s, m: merchantById(s.merchantId), f: forecast(s, now.value) }))
);
</script>

<template>
  <p v-if="subs.length === 0" class="rounded-[14px] bg-canvas px-4 py-6 text-center text-[13px] text-fg-3">No subscriptions yet</p>
  <ForenTable v-else class="table-flush" :caption="`Subscriptions on ${card.nickname}`" :min-width="0">
    <ForenTableHead>
      <tr>
        <ForenTableHeaderCell label="Merchant" />
        <ForenTableHeaderCell label="Next charge" class="hidden sm:table-cell" />
        <ForenTableHeaderCell label="Amount" align="right" />
      </tr>
    </ForenTableHead>
    <ForenTableBody>
      <ForenTableRow v-for="({ s, m, f }, i) in subs" :key="s.id" :last="i === subs.length - 1" @click="router.push(`/subscriptions?sub=${s.id}`)">
        <ForenTableCell :description="s.frequency === 'yearly' ? 'Yearly' : 'Monthly'" :avatar="{ initials: m?.mark, name: m?.name }">
          <template #label>
            <RouterLink :to="`/subscriptions?sub=${s.id}`" class="outline-none focus-visible:underline" @click.stop>{{ m?.name }}</RouterLink>
          </template>
        </ForenTableCell>
        <ForenTableCell v-if="s.blocked" type="badge" label="Blocked on this card" color="error" class="hidden sm:table-cell" />
        <ForenTableCell
          v-else
          class="hidden sm:table-cell"
          :label="f.kind === 'estimate' ? f.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Not enough history'"
          :description="f.kind === 'estimate' ? 'Estimate' : COPY.insufficientHistory"
        />
        <ForenTableCell align="right">
          <template #label><Money :value="s.usualAmount" /></template>
        </ForenTableCell>
      </ForenTableRow>
    </ForenTableBody>
  </ForenTable>
</template>
