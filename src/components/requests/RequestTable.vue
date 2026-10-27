<script setup lang="ts">
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenTable from "@/components/ui/ForenTable.vue";
import ForenTableBody from "@/components/ui/ForenTableBody.vue";
import ForenTableHead from "@/components/ui/ForenTableHead.vue";
import ForenTableHeaderCell from "@/components/ui/ForenTableHeaderCell.vue";
import ForenTableRow from "@/components/ui/ForenTableRow.vue";
import { timeAgo } from "@/components/cards/card-detail";
import type { CardRequest } from "@/domain/types";
import { personById, requestState, useAppStore } from "@/stores/app";
import { cn } from "@/lib/utils";
import RequestIcon from "./RequestIcon.vue";
import { KIND_LABEL, STATE, requestTitle } from "./requests-page";

defineProps<{ list: CardRequest[]; now: Date; compact: boolean; selectedId: string | null }>();
const emit = defineEmits<{ select: [id: string] }>();
const store = useAppStore();
const cardOf = (r: CardRequest) => store.cards.find((c) => c.id === r.cardId);
</script>

<template>
  <div class="hidden rounded-[20px] bg-surface px-6 py-4 md:block">
    <ForenTable class="table-flush" caption="Requests" :min-width="640">
      <ForenTableHead>
        <tr>
          <ForenTableHeaderCell label="Request" />
          <ForenTableHeaderCell label="From" />
          <ForenTableHeaderCell v-if="!compact" label="Card" />
          <ForenTableHeaderCell label="Status" align="right" />
        </tr>
      </ForenTableHead>
      <ForenTableBody>
        <ForenTableRow
          v-for="r in list"
          :key="r.id"
          :aria-selected="r.id === selectedId"
          :selected="r.id === selectedId"
          @click="emit('select', r.id)"
        >
          <td class="px-4 py-2.5">
            <div class="flex items-center gap-3">
              <RequestIcon :r="r" :state="requestState(r, now)" :size="32" />
              <button class="min-w-0 text-left outline-none focus-visible:underline" @click.stop="emit('select', r.id)">
                <span class="tnum block truncate text-[13px] font-medium text-fg">{{ requestTitle(r, cardOf(r)) }}</span>
                <span class="block truncate text-[12px] text-fg-3">{{ KIND_LABEL[r.kind] }} · {{ timeAgo(r.createdAt, now) }}</span>
              </button>
            </div>
          </td>
          <td class="px-4 py-2.5 text-[13px] text-fg">{{ personById(r.requesterId)?.name }}</td>
          <td v-if="!compact" class="tnum px-4 py-2.5 text-[13px] text-fg-2">{{ cardOf(r) ? `•• ${cardOf(r)!.last4} ${cardOf(r)!.nickname}` : "—" }}</td>
          <td class="px-4 py-2.5 text-right">
            <ForenBadge size="sm" :color="STATE[requestState(r, now)].color" dot>{{ STATE[requestState(r, now)].label }}</ForenBadge>
          </td>
        </ForenTableRow>
      </ForenTableBody>
    </ForenTable>
  </div>
  <!-- Phone list (Revolut "Card requests") -->
  <ul class="divide-y divide-line md:hidden">
    <li v-for="r in list" :key="r.id">
      <button class="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-subtle" @click="emit('select', r.id)">
        <RequestIcon :r="r" :state="requestState(r, now)" />
        <span class="min-w-0 flex-1">
          <span class="tnum block truncate text-[14px] font-semibold text-fg">{{ requestTitle(r, cardOf(r)) }}</span>
          <span class="block truncate text-[12px] text-fg-3">{{ personById(r.requesterId)?.name }} · {{ timeAgo(r.createdAt, now) }}</span>
          <span
            :class="
              cn(
                'block text-[12px] font-medium',
                requestState(r, now) === 'denied' ? 'text-error' : requestState(r, now) === 'pending' ? 'text-warning' : 'text-fg-2'
              )
            "
          >
            {{ STATE[requestState(r, now)].label }}
          </span>
        </span>
      </button>
    </li>
  </ul>
</template>
