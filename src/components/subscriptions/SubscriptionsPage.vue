<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  RiAlertLine,
  RiBankCardLine,
  RiCloseLine,
  RiRepeatLine,
} from "@/components/icons";
import CardsHeader from "@/components/cards/CardsHeader.vue";
import EmptyState from "@/components/EmptyState.vue";
import ErrorState from "@/components/ErrorState.vue";
import LoadingRows from "@/components/LoadingRows.vue";
import Money from "@/components/Money.vue";
import Sheet from "@/components/Sheet.vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInfoNote from "@/components/ui/ForenInfoNote.vue";
import { useLoad } from "@/composables/useLoad";
import { useNow } from "@/composables/useNow";
import { COPY } from "@/content/copy";
import { forecast } from "@/domain/forecast";
import { FREQUENCY_LABEL } from "@/domain/labels";
import { add } from "@/domain/money";
import type { Currency, Money as M } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { visibleCards } from "@/lib/permissions";
import ForenSelect from "@/components/ui/ForenSelect.vue";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app";
import RiskCallout from "./RiskCallout.vue";
import SubscriptionDetail from "./SubscriptionDetail.vue";
import SubTable from "./SubTable.vue";
import { useSubStatus, type SubRow } from "./subscriptions-page";

const store = useAppStore();
const now = useNow(30_000);
const statusOf = useSubStatus();
const { status, retry } = useLoad("subs");
const route = useRoute();
const router = useRouter();

const q = (k: string) => {
  const v = route.query[k];
  return (Array.isArray(v) ? v[0] : v) ?? null;
};
const cardFilter = computed(() => q("card") ?? "all");
const openId = computed(() => q("sub"));

const cardOptions = computed(() => [
  { value: "all", label: "All cards" },
  ...cardsWithSubs.value.map((c) => ({
    value: c.id,
    label: `${c.nickname} •• ${c.last4}`,
  })),
]);
function setParam(patch: Record<string, string | null>) {
  const next: Record<string, string> = {};
  for (const [k, v] of Object.entries(route.query))
    if (typeof v === "string") next[k] = v;
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "all") delete next[k];
    else next[k] = v;
  }
  router.replace({ path: route.path, query: next });
}

const mineCards = computed(() => visibleCards(store.role, store.cards));
const rows = computed<SubRow[]>(() =>
  store.subscriptions
    .map((s) => ({
      s,
      card: mineCards.value.find((c) => c.id === s.cardId)!,
      f: forecast(s, now.value),
    }))
    .filter(
      (r) =>
        r.card &&
        (cardFilter.value === "all" ||
          r.card.id === cardFilter.value ||
          r.s.movingToCardId === cardFilter.value),
    )
    .map((r) => ({ ...r, st: statusOf(r.s, r.card) }))
    .sort((a, b) => {
      const da = a.f.kind === "estimate" ? a.f.date.getTime() : Infinity;
      const db = b.f.kind === "estimate" ? b.f.date.getTime() : Infinity;
      return da - db;
    }),
);

const live = computed(() => rows.value);
const soon = computed(() =>
  live.value.filter((r) => r.f.kind === "estimate" && r.f.daysAway <= 7),
);
const later = computed(() =>
  live.value.filter((r) => !(r.f.kind === "estimate" && r.f.daysAway <= 7)),
);
const totals = (days: number) => {
  const m = new Map<Currency, M>();
  live.value.forEach((r) => {
    if (r.f.kind === "estimate" && r.f.daysAway <= days)
      m.set(
        r.f.amount.currency,
        m.has(r.f.amount.currency)
          ? add(m.get(r.f.amount.currency)!, r.f.amount)
          : r.f.amount,
      );
  });
  return [...m.values()];
};
const open = computed(() => rows.value.find((r) => r.s.id === openId.value));

const showTip = ref(
  (() => {
    try {
      return localStorage.getItem("foren-sub-tip") !== "hidden";
    } catch {
      return true;
    }
  })(),
);
function dismissTip() {
  showTip.value = false;
  try {
    localStorage.setItem("foren-sub-tip", "hidden");
  } catch {
    /* storage unavailable */
  }
}
const cardsWithSubs = computed(() =>
  mineCards.value.filter((c) =>
    store.subscriptions.some((s) => s.cardId === c.id),
  ),
);
const attention = computed(() =>
  rows.value.filter((r) => r.st.kind === "at_risk" || r.st.kind === "declined"),
);
const split = false; // details open in a drawer (Figma), so the list keeps its full width
const select = (id: string) =>
  setParam({ sub: id === openId.value ? null : id });
const groups = computed<[string, SubRow[]][]>(() => [
  ["Due in the next 7 days", soon.value],
  ["Later", later.value],
]);
</script>

<template>
  <div>
    <CardsHeader tab="subscriptions" />

    <!-- Toolbar -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <ForenSelect
        size="xs"
        aria-label="Card"
        :model-value="cardFilter"
        :options="cardOptions"
        @update:model-value="(v) => setParam({ card: v })"
      />
      <span class="text-[13px] text-fg-3">Estimates based on past charges</span>
    </div>

    <LoadingRows v-if="status === 'loading'" />
    <ErrorState v-if="status === 'error'" @retry="retry" />
    <EmptyState
      v-if="status === 'ready' && rows.length === 0"
      :title="COPY.subscriptionsEmpty.title"
      :body="COPY.subscriptionsEmpty.body"
    >
      <template #icon><RiRepeatLine /></template>
    </EmptyState>
    <div
      v-if="status === 'ready' && rows.length > 0"
      :class="
        cn('grid items-start gap-6', split && 'grid-cols-[minmax(0,1fr)_420px]')
      "
    >
      <div class="min-w-0 space-y-4">
        <!-- Estimates strip -->
        <dl
          class="grid divide-y divide-line rounded-[20px] bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          <div v-for="d in [7, 30]" :key="d" class="px-4 py-3">
            <dt
              class="flex items-center gap-1.5 text-[12px] font-medium text-fg-3"
            >
              Next {{ d }} days
              <ForenBadge size="sm" color="gray">Estimate</ForenBadge>
            </dt>
            <dd
              class="tnum mt-1 flex flex-wrap gap-x-3 text-[17px] font-semibold text-fg"
            >
              <template v-if="totals(d).length"
                ><Money v-for="m in totals(d)" :key="m.currency" :value="m"
              /></template>
              <span v-else class="text-fg-3">Nothing expected</span>
            </dd>
          </div>
          <div class="px-4 py-3">
            <dt class="text-[12px] font-medium text-fg-3">Subscriptions</dt>
            <dd class="tnum mt-1 text-[17px] font-semibold text-fg">
              {{ live.length }} active
            </dd>
          </div>
        </dl>

        <ForenInfoNote v-if="showTip" class="bg-surface">
          <template #icon><RiBankCardLine /></template>
          <template #action>
            <ForenButton
              variant="ghost"
              size="xxs"
              aria-label="Dismiss tip"
              class="px-2"
              @click="dismissTip"
            >
              <template #leadingIcon><RiCloseLine /></template>
            </ForenButton>
          </template>
          Give each subscription its own card to stop one without affecting the
          rest.
        </ForenInfoNote>

        <section
          v-if="attention.length > 0"
          aria-label="Needs attention"
          aria-live="polite"
          class="overflow-hidden rounded-[20px]"
        >
          <div
            class="flex items-center gap-2 bg-warning-subtle px-4 py-2 text-[12px] font-semibold text-warning"
          >
            <RiAlertLine class="size-4" aria-hidden="true" /> Needs attention ·
            {{ attention.length }}
          </div>
          <ul class="divide-y divide-line bg-surface">
            <RiskCallout
              v-for="r in attention"
              :key="r.s.id"
              :r="r"
              @open="select(r.s.id)"
            />
          </ul>
        </section>

        <SubTable
          :groups="groups"
          :compact="split"
          :selected-id="openId"
          @select="select"
        />
      </div>
    </div>

    <Sheet
      :open="!!open"
      :title="open ? (merchantById(open.s.merchantId)?.name ?? '') : ''"
      :description="
        open
          ? `${FREQUENCY_LABEL[open.s.frequency]} · ${open.card.nickname} •• ${open.card.last4}`
          : undefined
      "
      @update:open="(o) => !o && setParam({ sub: null })"
    >
      <SubscriptionDetail
        v-if="open"
        :sub="open.s"
        :card="open.card"
        :status="open.st"
      />
    </Sheet>
  </div>
</template>
