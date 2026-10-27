<script setup lang="ts">
/** Dense Mercury-style table, grouped by when the next charge is expected. */
import { computed } from "vue";
import MerchantLogo from "@/components/MerchantLogo.vue";
import Money from "@/components/Money.vue";
import ForenTable from "@/components/ui/ForenTable.vue";
import ForenTableBody from "@/components/ui/ForenTableBody.vue";
import ForenTableHead from "@/components/ui/ForenTableHead.vue";
import ForenTableHeaderCell from "@/components/ui/ForenTableHeaderCell.vue";
import ForenTableRow from "@/components/ui/ForenTableRow.vue";
import { FREQUENCY_LABEL } from "@/domain/labels";
import { merchantById } from "@/fixtures/merchants";
import SubStatusBadge from "./SubStatusBadge.vue";
import { short, type SubRow } from "./subscriptions-page";

const props = defineProps<{ groups: [string, SubRow[]][]; compact: boolean; selectedId: string | null }>();
const emit = defineEmits<{ select: [id: string] }>();
const cols = computed(() => (props.compact ? 3 : 5));
</script>

<template>
  <div class="hidden rounded-[20px] bg-surface px-6 py-4 md:block">
    <ForenTable class="table-flush" caption="Subscriptions" :min-width="720">
      <ForenTableHead>
        <tr>
          <ForenTableHeaderCell label="Merchant" />
          <ForenTableHeaderCell v-if="!compact" label="Card" />
          <ForenTableHeaderCell label="Next charge" />
          <ForenTableHeaderCell v-if="!compact" label="Amount" align="right" />
          <ForenTableHeaderCell label="Status" align="right" />
        </tr>
      </ForenTableHead>
      <template v-for="[title, rows] in groups" :key="title">
        <ForenTableBody v-if="rows.length">
          <tr>
            <th :colspan="cols" scope="colgroup" class="bg-sunken px-4 py-1.5 text-left text-[12px] font-semibold text-fg-2">
              {{ title }} <span class="tnum font-normal text-fg-3">· {{ rows.length }}</span>
            </th>
          </tr>
          <ForenTableRow
            v-for="r in rows"
            :key="r.s.id"
            :aria-selected="r.s.id === selectedId"
            :selected="r.s.id === selectedId"
            @click="emit('select', r.s.id)"
          >
            <td class="px-4 py-2.5">
              <div class="flex items-center gap-2.5">
                <MerchantLogo :merchant="merchantById(r.s.merchantId)" :size="28" />
                <button class="min-w-0 truncate text-left text-[13px] font-medium text-fg outline-none focus-visible:underline" @click.stop="emit('select', r.s.id)">
                  {{ merchantById(r.s.merchantId)?.name }}
                  <span class="block text-[12px] font-normal text-fg-3">{{ FREQUENCY_LABEL[r.s.frequency] }}</span>
                </button>
              </div>
            </td>
            <td v-if="!compact" class="tnum px-4 py-2.5 text-[13px] text-fg-2">
              •• {{ r.card.last4 }} <span class="text-fg">{{ r.card.nickname }}</span>
            </td>
            <td class="tnum px-4 py-2.5 text-[13px] text-fg">
              <span v-if="r.s.blocked" class="text-fg-3">No more charges</span>
              <template v-else-if="r.f.kind === 'estimate'">{{ short(r.f.date) }}</template>
              <span v-else class="text-fg-3">Not enough history</span>
            </td>
            <td v-if="!compact" class="tnum px-4 py-2.5 text-right text-[13px] text-fg">
              <Money :value="r.f.kind === 'estimate' ? r.f.amount : r.s.usualAmount" />
            </td>
            <td class="px-4 py-2.5 text-right">
              <SubStatusBadge :st="r.st" />
            </td>
          </ForenTableRow>
        </ForenTableBody>
      </template>
    </ForenTable>
  </div>
  <!-- Phone list -->
  <div class="space-y-4 md:hidden">
    <template v-for="[title, rows] in groups" :key="title">
      <section v-if="rows.length" :aria-label="title">
        <h2 class="mb-1 text-[12px] font-semibold text-fg-2">
          {{ title }} <span class="tnum font-normal text-fg-3">· {{ rows.length }}</span>
        </h2>
        <ul class="divide-y divide-line">
          <li v-for="r in rows" :key="r.s.id">
            <button class="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-subtle" @click="emit('select', r.s.id)">
              <MerchantLogo :merchant="merchantById(r.s.merchantId)" :size="36" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[14px] font-semibold text-fg">{{ merchantById(r.s.merchantId)?.name }}</span>
                <span class="tnum block truncate text-[12px] text-fg-3">
                  {{ r.f.kind === "estimate" && !r.s.blocked ? `${short(r.f.date)} · ` : "" }}•• {{ r.card.last4 }} {{ r.card.nickname }}
                </span>
              </span>
              <span class="flex flex-col items-end gap-1">
                <Money :value="r.f.kind === 'estimate' ? r.f.amount : r.s.usualAmount" class="tnum text-[14px] font-semibold text-fg" />
                <SubStatusBadge :st="r.st" />
              </span>
            </button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
