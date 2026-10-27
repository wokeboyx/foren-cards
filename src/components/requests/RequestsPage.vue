<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { RiAlarmWarningLine, RiInboxLine } from "@/components/icons";
import EmptyState from "@/components/EmptyState.vue";
import ErrorState from "@/components/ErrorState.vue";
import LoadingRows from "@/components/LoadingRows.vue";
import PageHeader from "@/components/PageHeader.vue";
import Sheet from "@/components/Sheet.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import { useLoad } from "@/composables/useLoad";
import { useNow } from "@/composables/useNow";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { currentUserId, requestState, useAppStore } from "@/stores/app";
import EmergencyRequestModal from "./EmergencyRequestModal.vue";
import RequestDetail from "./RequestDetail.vue";
import RequestTable from "./RequestTable.vue";

const store = useAppStore();
const now = useNow(1000);
const { status, retry } = useLoad("requests");
const route = useRoute();
const router = useRouter();
const tab = ref<"pending" | "history">("pending");
const emergencyOpen = ref(false);
const approver = computed(() => can(store.role, "approve"));
const mine = computed(() =>
  approver.value || store.role === "finance" ? store.requests : store.requests.filter((r) => r.requesterId === currentUserId(store.role))
);
const pending = computed(() => mine.value.filter((r) => requestState(r, now.value) === "pending"));
const history = computed(() => mine.value.filter((r) => requestState(r, now.value) !== "pending"));
const list = computed(() => (tab.value === "pending" ? pending.value : history.value));
const openId = computed(() => (typeof route.query.r === "string" ? route.query.r : null));
const selected = computed(() => mine.value.find((r) => r.id === openId.value));
const split = false; // details open in a drawer (Figma), so the list keeps its full width
const select = (id: string | null) => router.replace({ path: route.path, query: id ? { r: id } : {} });
const tabOptions = computed(() => [
  { value: "pending" as const, label: `${approver.value ? "To review" : "Open"} · ${pending.value.length}` },
  { value: "history" as const, label: "History" },
]);
</script>

<template>
  <div>
    <PageHeader
      title="Requests"
      :description="approver ? 'Approve or decline what your team asks for.' : 'What you’ve asked the account owner for.'"
    >
      <template v-if="store.role === 'cardholder'" #actions>
        <ForenButton size="xxs" variant="outline" @click="emergencyOpen = true">
          <template #leadingIcon><RiAlarmWarningLine /></template>
          Request emergency card
        </ForenButton>
      </template>
      <template #tabs>
        <ForenSegmentedControl v-model="tab" size="lg" ariaLabel="Requests" :options="tabOptions" />
      </template>
    </PageHeader>

    <LoadingRows v-if="status === 'loading'" :rows="3" />
    <ErrorState v-if="status === 'error'" @retry="retry" />
    <div v-if="status === 'ready'" :class="cn('grid items-start gap-6', split && 'grid-cols-[minmax(0,1fr)_420px]')">
      <div class="min-w-0">
        <EmptyState
          v-if="list.length === 0"
          :title="tab === 'pending' ? 'Nothing waiting' : 'No past requests'"
          :body="
            tab === 'pending'
              ? approver
                ? 'When a cardholder asks for an approval, unfreeze or emergency card, it’ll appear here.'
                : 'Requests you send from a declined payment or a frozen card appear here.'
              : 'Decided requests appear here.'
          "
        >
          <template #icon><RiInboxLine /></template>
        </EmptyState>
        <RequestTable v-else :list="list" :now="now" :compact="split" :selected-id="openId" @select="(id) => select(id === openId ? null : id)" />
      </div>
    </div>
    <Sheet :open="!!selected" title="Request details" @update:open="(o) => !o && select(null)">
      <RequestDetail v-if="selected" :r="selected" :can-decide="approver" />
    </Sheet>
    <EmergencyRequestModal :key="emergencyOpen ? 'open' : 'closed'" v-model:open="emergencyOpen" />
  </div>
</template>
