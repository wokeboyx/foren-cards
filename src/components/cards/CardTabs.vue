<script setup lang="ts">
/** Recent transactions, Card controls and Subscriptions share one panel, switched with the DS Segmented control. */
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import type { Card } from "@/domain/types";
import { useAppStore } from "@/stores/app";
import type { DialogKind } from "./card-detail";
import CardControls from "./CardControls.vue";
import CardSubscriptionsTab from "./CardSubscriptionsTab.vue";
import CardTransactionsTab from "./CardTransactionsTab.vue";

type TabKey = "transactions" | "controls" | "subscriptions";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ pick: [d: DialogKind] }>();

const route = useRoute();
const store = useAppStore();
const subCount = computed(() => store.subscriptions.filter((s) => s.cardId === props.card.id).length);
const initial = route.query.tab;
const tab = ref<TabKey>(initial === "controls" || initial === "subscriptions" ? initial : "transactions");
const options = computed<{ value: TabKey; label: string }[]>(() => [
  { value: "transactions", label: "Recent transactions" },
  ...(props.card.status !== "canceled" ? [{ value: "controls" as const, label: "Card controls" }] : []),
  { value: "subscriptions", label: subCount.value ? `Subscriptions · ${subCount.value}` : "Subscriptions" },
]);
const active = computed(() => (options.value.some((o) => o.value === tab.value) ? tab.value : "transactions"));
</script>

<template>
  <section class="rounded-[20px] bg-surface px-6 py-4" aria-label="Card activity and controls">
    <div class="max-w-full overflow-x-auto">
      <ForenSegmentedControl size="lg" aria-label="Card sections" :options="options" :model-value="active" @update:model-value="(v) => (tab = v)" />
    </div>
    <div class="mt-6" role="tabpanel" :aria-label="options.find((o) => o.value === active)?.label">
      <CardTransactionsTab v-if="active === 'transactions'" :card="card" />
      <CardControls v-if="active === 'controls'" :card="card" @pick="(d) => emit('pick', d)" />
      <CardSubscriptionsTab v-if="active === 'subscriptions'" :card="card" />
    </div>
  </section>
</template>
