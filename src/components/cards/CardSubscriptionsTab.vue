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
import type { Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { useAppStore } from "@/stores/app";

const props = defineProps<{ card: Card }>();
const router = useRouter();
const store = useAppStore();
const subs = computed(() =>
  store.subscriptions
    .filter((s) => s.cardId === props.card.id)
    .map((s) => ({ s, m: merchantById(s.merchantId) })),
);
</script>

<template>
  <p
    v-if="subs.length === 0"
    class="rounded-[14px] bg-canvas px-4 py-6 text-center text-[13px] text-fg-3"
  >
    No subscriptions yet
  </p>
  <ForenTable
    v-else
    class="table-flush"
    :caption="`Subscriptions on ${card.nickname}`"
    :min-width="0"
  >
    <ForenTableHead>
      <tr>
        <ForenTableHeaderCell label="Merchant" />
        <ForenTableHeaderCell label="Amount" align="right" />
      </tr>
    </ForenTableHead>
    <ForenTableBody>
      <ForenTableRow
        v-for="({ s, m }, i) in subs"
        :key="s.id"
        :last="i === subs.length - 1"
        @click="router.push(`/subscriptions?sub=${s.id}`)"
      >
        <ForenTableCell
          :description="s.frequency === 'yearly' ? 'Yearly' : 'Monthly'"
          :avatar="{ initials: m?.mark, name: m?.name }"
        >
          <template #label>
            <RouterLink
              :to="`/subscriptions?sub=${s.id}`"
              class="outline-none focus-visible:underline"
              @click.stop
              >{{ m?.name }}</RouterLink
            >
          </template>
        </ForenTableCell>
        <ForenTableCell align="right">
          <template #label><Money :value="s.usualAmount" /></template>
        </ForenTableCell>
      </ForenTableRow>
    </ForenTableBody>
  </ForenTable>
</template>
