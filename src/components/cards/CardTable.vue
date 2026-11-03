<script setup lang="ts">
import { computed } from "vue";
import { RiBuilding2Line } from "@/components/icons";
import CardArt from "@/components/card/CardArt.vue";
import CardStatusBadge from "@/components/card/CardStatusBadge.vue";
import { usedBy } from "@/components/card/holder";
import { listStatus } from "@/components/card/status-badge";
import ForenAvatar from "@/components/ui/ForenAvatar.vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenTable from "@/components/ui/ForenTable.vue";
import ForenTableBody from "@/components/ui/ForenTableBody.vue";
import ForenTableHead from "@/components/ui/ForenTableHead.vue";
import ForenTableHeaderCell from "@/components/ui/ForenTableHeaderCell.vue";
import ForenTableRow from "@/components/ui/ForenTableRow.vue";
import { STATUS_LABEL } from "@/domain/labels";
import { format } from "@/domain/money";
import { limitSummary } from "@/domain/limits";
import type { Card, CardRequest } from "@/domain/types";
import { currentUserId, personById, useAppStore } from "@/stores/app";
import { timeAgo } from "./card-detail";
import PendingRequestBadge from "./PendingRequestBadge.vue";
import PendingRequestRow from "./PendingRequestRow.vue";

const props = defineProps<{
  cards: Card[];
  requests: CardRequest[];
  compact: boolean;
  selectedId: string | null;
  now: Date;
}>();
const emit = defineEmits<{
  select: [id: string];
  selectRequest: [id: string];
}>();
const store = useAppStore();
const me = computed(() => currentUserId(store.role));
const rows = computed(() =>
  props.cards.map((c) => {
    const holder = personById(c.holderId);
    return {
      c,
      holder,
      initials: holder?.name
        .split(" ")
        .map((x) => x[0])
        .join(""),
      showStatus: listStatus(c) !== "active" || c.kind === "emergency",
    };
  }),
);
</script>

<template>
  <!-- Desktop / tablet table (DS Table) -->
  <ForenTable
    caption="Company cards"
    class="table-flush hidden md:block"
    :min-width="720"
  >
    <ForenTableHead>
      <tr>
        <ForenTableHeaderCell label="Cardholder" />
        <ForenTableHeaderCell label="Card" />
        <ForenTableHeaderCell v-if="!compact" label="Balance" align="right" />
      </tr>
    </ForenTableHead>
    <ForenTableBody>
      <PendingRequestRow
        v-for="r in requests"
        :key="r.id"
        :r="r"
        :compact="compact"
        :selected="r.id === selectedId"
        :me="me"
        @select="emit('selectRequest', r.id)"
      />
      <ForenTableRow
        v-for="{ c, holder, initials, showStatus } in rows"
        :key="c.id"
        :selected="c.id === selectedId"
        :aria-selected="c.id === selectedId"
        @click="emit('select', c.id)"
      >
        <td class="px-4 py-2.5">
          <div class="flex items-center gap-2.5">
            <span
              v-if="c.companyCard"
              class="grid size-6 shrink-0 place-items-center rounded-full bg-subtle text-fg-2 ring-1 ring-line"
              aria-hidden="true"
            >
              <RiBuilding2Line class="size-3.5" />
            </span>
            <ForenAvatar
              v-else
              size="xs"
              :name="holder?.name"
              :initials="initials"
              fallback="initials"
            />
            <span class="min-w-0">
              <span class="block truncate text-[13px] text-fg">{{
                c.companyCard ? "Company card" : holder?.name
              }}</span>
              <span
                v-if="c.companyCard"
                class="block truncate text-[11px] text-fg-3"
                >{{ usedBy(c) }}</span
              >
            </span>
            <ForenBadge
              v-if="holder?.invited && !c.companyCard"
              size="sm"
              color="orange"
              >Invite pending</ForenBadge
            >
            <ForenBadge
              v-if="c.holderId === me && !c.companyCard"
              size="sm"
              color="primary"
              >You</ForenBadge
            >
          </div>
        </td>
        <td class="px-4 py-2.5">
          <div class="flex items-center gap-2.5">
            <CardArt :card="c" size="xs" />
            <button
              class="tnum min-w-0 truncate text-left text-[13px] text-fg outline-none focus-visible:underline"
              :aria-label="`${c.nickname}, card ending ${c.last4}, ${STATUS_LABEL[c.status]}`"
              @click.stop="emit('select', c.id)"
            >
              <span class="text-fg-2">•• {{ c.last4 }}</span
              >{{ " " }}<span class="font-medium">{{ c.nickname }}</span>
            </button>
            <CardStatusBadge v-if="showStatus" :card="c" size="sm" />
          </div>
        </td>
        <td
          v-if="!compact"
          class="tnum px-4 py-2.5 text-right text-[13px] whitespace-nowrap"
          :class="
            c.balance.minor <= 0 && c.status !== 'canceled'
              ? 'font-medium text-warning'
              : 'text-fg-2'
          "
        >
          {{
            c.status === "canceled"
              ? "—"
              : c.balance.minor <= 0
                ? "Not funded"
                : format(c.balance, { compact: true })
          }}
        </td>
      </ForenTableRow>
    </ForenTableBody>
  </ForenTable>
  <!-- Phone list -->
  <ul class="divide-y divide-line md:hidden">
    <li v-for="r in requests" :key="r.id">
      <button
        class="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-subtle"
        @click="emit('selectRequest', r.id)"
      >
        <CardArt
          :card="{
            design: r.newCard!.design,
            nickname: r.newCard!.nickname,
            last4: '',
            kind: 'standard',
            status: 'active',
          }"
          size="sm"
          class="opacity-60"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-[14px] font-semibold text-fg">{{
              r.newCard!.nickname
            }}</span>
            <PendingRequestBadge />
          </div>
          <div class="truncate text-[12px] text-fg-3">
            {{ personById(r.requesterId)?.name }} · asked
            {{ timeAgo(r.createdAt, now) }}
          </div>
          <div class="tnum mt-1 text-[12px] text-fg-2">
            {{ limitSummary(r.newCard!.limit, { compact: true }) }}
          </div>
        </div>
      </button>
    </li>
    <li v-for="{ c, holder, showStatus } in rows" :key="c.id">
      <button
        class="flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-subtle"
        @click="emit('select', c.id)"
      >
        <CardArt :card="c" size="sm" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-[14px] font-semibold text-fg">{{
              c.nickname
            }}</span>
            <CardStatusBadge v-if="showStatus" :card="c" size="sm" />
          </div>
          <div class="tnum truncate text-[12px] text-fg-3">
            {{ c.companyCard ? "Company card" : holder?.name }} · ••
            {{ c.last4 }}
          </div>
          <div
            v-if="c.status !== 'canceled'"
            class="tnum mt-1 text-[12px] text-fg-2"
          >
            {{
              c.balance.minor <= 0
                ? "Not funded"
                : `${format(c.balance, { compact: true })} balance`
            }}
          </div>
        </div>
      </button>
    </li>
  </ul>
</template>
