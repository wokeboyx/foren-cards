<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter, type LocationQueryRaw } from "vue-router";
import { RiArchiveLine, RiBankCardLine } from "@/components/icons";
import { listStatus } from "@/components/card/status-badge";
import EmptyState from "@/components/EmptyState.vue";
import ErrorState from "@/components/ErrorState.vue";
import LoadingRows from "@/components/LoadingRows.vue";
import Sheet from "@/components/Sheet.vue";
import RequestDetail from "@/components/requests/RequestDetail.vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { useLoad } from "@/composables/useLoad";
import { useNow } from "@/composables/useNow";
import { can, visibleCards } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { allPeople, personById, useAppStore } from "@/stores/app";
import type { CardRequest } from "@/domain/types";
import type { DialogKind } from "./card-detail";
import CardDialogs from "./CardDialogs.vue";
import CardPanel from "./CardPanel.vue";
import CardsFilterMenu from "./CardsFilterMenu.vue";
import CardsHeader from "./CardsHeader.vue";
import CardTable from "./CardTable.vue";
import SetupChecklist from "./SetupChecklist.vue";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "frozen", label: "Frozen" },
] as const;

const store = useAppStore();
const now = useNow(30_000);
const router = useRouter();
const route = useRoute();
const { status, retry } = useLoad("cards");

const param = (k: string) => {
  const v = route.query[k];
  return typeof v === "string" ? v : null;
};
const view = computed(() =>
  param("view") === "archived" ? "archived" : "manage",
);
const statusFilter = computed(() => param("status"));
const holderFilter = computed(() => param("holder"));
const openId = computed(() => param("card"));
const openRequestId = computed(() => param("request"));
// Card requests are hidden for now, so no "Pending request" rows.
const pendingCards = computed<CardRequest[]>(() => []);
const selectedRequest = computed<CardRequest | undefined>(() => undefined);

function setParam(patch: Record<string, string | null>) {
  const next: LocationQueryRaw = { ...route.query };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete next[k];
    else next[k] = v;
  }
  router.replace({ path: route.path, query: next });
}

const cards = computed(() => visibleCards(store.role, store.cards));
const inView = computed(() =>
  cards.value.filter((c) =>
    view.value === "archived"
      ? c.archived || c.status === "canceled"
      : !c.archived && c.status !== "canceled",
  ),
);
const filtered = computed(() =>
  inView.value.filter(
    (c) =>
      (!statusFilter.value || listStatus(c) === statusFilter.value) &&
      (!holderFilter.value || c.holderId === holderFilter.value),
  ),
);
const filters = computed(
  () =>
    [
      statusFilter.value && {
        key: "status",
        label: `Status: ${STATUS_OPTIONS.find((o) => o.value === statusFilter.value)?.label}`,
      },
      holderFilter.value && {
        key: "holder",
        label: `Cardholder: ${personById(holderFilter.value)?.name}`,
      },
    ].filter(Boolean) as { key: string; label: string }[],
);
// Mercury: a card opens in a panel beside the list (a full-screen sheet on phones).
const openCard = computed(() => cards.value.find((c) => c.id === openId.value));
const wide = ref(true);
let mq: MediaQueryList | undefined;
const syncWide = () => (wide.value = !!mq?.matches);
onMounted(() => {
  mq = window.matchMedia("(min-width: 1024px)");
  syncWide();
  mq.addEventListener("change", syncWide);
});
onBeforeUnmount(() => mq?.removeEventListener("change", syncWide));
const split = computed(() => !!openCard.value && wide.value);
const dialog = ref<DialogKind>(null);
const holders = computed(() =>
  allPeople().filter((p) => cards.value.some((c) => c.holderId === p.id)),
);
const counts = (v: string) =>
  inView.value.filter((c) => listStatus(c) === v).length;
const clearFilters = () => setParam({ status: null, holder: null, type: null });

const firstVisit = computed(
  () =>
    status.value === "ready" &&
    cards.value.length === 0 &&
    pendingCards.value.length === 0 &&
    view.value === "manage",
);
</script>

<template>
  <div v-if="firstVisit">
    <CardsHeader tab="manage" :hide-create="can(store.role, 'issue')" />
    <SetupChecklist />
  </div>

  <div v-else>
    <CardsHeader :tab="view" />

    <!-- Toolbar -->
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <CardsFilterMenu
        :role="store.role"
        :holders="holders"
        :status-options="STATUS_OPTIONS"
        :counts="counts"
        :show-status="view === 'manage'"
        @pick="(k, v) => setParam({ [k]: v })"
      />
      <template v-if="filters.length > 0">
        <ForenBadge
          v-for="f in filters"
          :key="f.key"
          size="lg"
          color="primary"
          :dismiss-label="`Remove ${f.label}`"
          @dismiss="setParam({ [f.key]: null })"
        >
          {{ f.label }}
        </ForenBadge>
        <button
          class="text-[13px] font-semibold text-fg-2 underline-offset-2 hover:underline"
          @click="clearFilters"
        >
          Clear all
        </button>
      </template>
    </div>
    <LoadingRows v-if="status === 'loading'" />
    <ErrorState v-if="status === 'error'" @retry="retry" />
    <div
      v-if="status === 'ready'"
      :class="
        cn('grid items-start gap-6', split && 'grid-cols-[minmax(0,1fr)_400px]')
      "
    >
      <div class="min-w-0">
        <template v-if="filtered.length === 0 && pendingCards.length === 0">
          <EmptyState
            v-if="view === 'archived'"
            title="No archived cards"
            body="When you terminate a card, it will appear here."
          >
            <template #icon><RiArchiveLine /></template>
          </EmptyState>
          <EmptyState
            v-else
            :title="
              filters.length ? 'No cards match these filters' : 'No cards yet'
            "
            :body="
              filters.length
                ? 'Try a different status, type or cardholder.'
                : 'Cards issued to you will appear here.'
            "
          >
            <template #icon><RiBankCardLine /></template>
            <template v-if="filters.length > 0" #action>
              <ForenButton variant="outline" size="sm" @click="clearFilters"
                >Clear filters</ForenButton
              >
            </template>
          </EmptyState>
        </template>
        <div v-else class="rounded-[20px] bg-surface px-6 py-4">
          <CardTable
            :cards="filtered"
            :requests="pendingCards"
            :compact="split"
            :selected-id="openRequestId ?? openId"
            :now="now"
            @select="
              (id) =>
                setParam({ card: id === openId ? null : id, request: null })
            "
            @select-request="
              (id) =>
                setParam({
                  request: id === openRequestId ? null : id,
                  card: null,
                })
            "
          />
        </div>
      </div>
      <div v-if="split && openCard" class="sticky top-4">
        <CardPanel
          :card="openCard"
          closable
          @pick="(d) => (dialog = d)"
          @close="setParam({ card: null })"
        />
      </div>
    </div>

    <Sheet
      :open="!!openCard && !wide"
      :title="openCard?.nickname ?? ''"
      @update:open="(o) => !o && setParam({ card: null })"
    >
      <div v-if="openCard" class="p-4">
        <CardPanel :card="openCard" @pick="(d) => (dialog = d)" />
      </div>
    </Sheet>
    <CardDialogs
      v-if="openCard"
      :key="dialog ?? 'closed'"
      v-model:dialog="dialog"
      :card="openCard"
    />

    <Sheet
      :open="!!selectedRequest"
      title="Request details"
      @update:open="(o) => !o && setParam({ request: null })"
    >
      <RequestDetail
        v-if="selectedRequest"
        :r="selectedRequest"
        :can-decide="can(store.role, 'approve')"
      />
    </Sheet>
  </div>
</template>
