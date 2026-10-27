<script setup lang="ts">
import { computed, watchEffect } from "vue";
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
import { allPeople, currentUserId, personById, useAppStore } from "@/stores/app";
import CardDraftList from "./CardDraftList.vue";
import CardsFilterMenu from "./CardsFilterMenu.vue";
import CardsHeader from "./CardsHeader.vue";
import CardTable from "./CardTable.vue";
import SetupChecklist from "./SetupChecklist.vue";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "frozen", label: "Frozen" },
  { value: "canceled", label: "Canceled" },
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
const view = computed(() => (param("view") === "archived" ? "archived" : "manage"));
const statusFilter = computed(() => param("status"));
const holderFilter = computed(() => param("holder"));
const openId = computed(() => param("card"));
const openRequestId = computed(() => param("request"));
const me = computed(() => currentUserId(store.role));
// Card requests sit in the list as "Pending request" rows: the requester sees theirs, the owner sees all.
const pendingCards = computed(() =>
  view.value === "manage" && !statusFilter.value
    ? store.requests.filter(
        (r) =>
          r.kind === "new_card" &&
          r.state === "pending" &&
          (store.role === "cardholder" ? r.requesterId === me.value : true) &&
          (!holderFilter.value || r.requesterId === holderFilter.value)
      )
    : []
);
const selectedRequest = computed(() => store.requests.find((r) => r.id === openRequestId.value && r.kind === "new_card"));
const myDrafts = computed(() => (view.value === "manage" && !statusFilter.value && can(store.role, "issue") ? store.cardDrafts : []));

function setParam(patch: Record<string, string | null>) {
  const next: LocationQueryRaw = { ...route.query };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete next[k];
    else next[k] = v;
  }
  router.replace({ path: route.path, query: next });
}

const cards = computed(() => visibleCards(store.role, store.cards));
const inView = computed(() => cards.value.filter((c) => (view.value === "archived" ? c.archived : !c.archived)));
const filtered = computed(() =>
  inView.value.filter((c) => (!statusFilter.value || listStatus(c) === statusFilter.value) && (!holderFilter.value || c.holderId === holderFilter.value))
);
const filters = computed(
  () =>
    [
      statusFilter.value && { key: "status", label: `Status: ${STATUS_OPTIONS.find((o) => o.value === statusFilter.value)?.label}` },
      holderFilter.value && { key: "holder", label: `Cardholder: ${personById(holderFilter.value)?.name}` },
    ].filter(Boolean) as { key: string; label: string }[]
);
const split = false; // details open in a drawer (Figma), so the list keeps its full width
const holders = computed(() => allPeople().filter((p) => cards.value.some((c) => c.holderId === p.id)));
const counts = (v: string) => inView.value.filter((c) => listStatus(c) === v).length;
const clearFilters = () => setParam({ status: null, holder: null, type: null });

// Cards open on their own page; old ?card= links still land there.
watchEffect(() => {
  if (openId.value) router.replace(`/cards/${openId.value}`);
});

const firstVisit = computed(
  () => status.value === "ready" && cards.value.length === 0 && pendingCards.value.length === 0 && myDrafts.value.length === 0 && view.value === "manage"
);
</script>

<template>
  <div v-if="firstVisit">
    <CardsHeader tab="manage" />
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
      <span v-if="filters.length === 0" class="text-[13px] text-fg-3">No filters applied</span>
      <template v-else>
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
        <button class="text-[13px] font-semibold text-fg-2 underline-offset-2 hover:underline" @click="clearFilters">Clear all</button>
      </template>
    </div>
    <p v-if="view === 'archived'" class="mb-3 text-[13px] leading-[18px] text-fg-3">
      Archived cards are canceled cards you’ve moved out of the main list. They can’t be used, and their history is kept.
    </p>

    <LoadingRows v-if="status === 'loading'" />
    <ErrorState v-if="status === 'error'" @retry="retry" />
    <div v-if="status === 'ready'" :class="cn('grid items-start gap-6', split && 'grid-cols-[minmax(0,1fr)_420px]')">
      <div class="min-w-0">
        <CardDraftList v-if="myDrafts.length > 0" :drafts="myDrafts" />
        <template v-if="filtered.length === 0 && pendingCards.length === 0">
          <EmptyState v-if="view === 'archived'" title="No archived cards" body="When you archive a canceled card, it moves here.">
            <template #icon><RiArchiveLine /></template>
          </EmptyState>
          <EmptyState
            v-else
            :title="filters.length ? 'No cards match these filters' : 'No cards yet'"
            :body="filters.length ? 'Try a different status, type or cardholder.' : 'Cards issued to you will appear here.'"
          >
            <template #icon><RiBankCardLine /></template>
            <template v-if="filters.length > 0" #action>
              <ForenButton variant="outline" size="sm" @click="clearFilters">Clear filters</ForenButton>
            </template>
          </EmptyState>
        </template>
        <div v-else class="rounded-[20px] bg-surface px-6 py-4">
          <CardTable
            :cards="filtered"
            :requests="pendingCards"
            :compact="split"
            :selected-id="openRequestId"
            :now="now"
            :txns="store.transactions"
            @select="(id) => router.push(`/cards/${id}`)"
            @select-request="(id) => setParam({ request: id === openRequestId ? null : id, card: null })"
          />
        </div>
      </div>
    </div>

    <Sheet :open="!!selectedRequest" title="Request details" @update:open="(o) => !o && setParam({ request: null })">
      <RequestDetail v-if="selectedRequest" :r="selectedRequest" :can-decide="can(store.role, 'approve')" />
    </Sheet>
  </div>
</template>
