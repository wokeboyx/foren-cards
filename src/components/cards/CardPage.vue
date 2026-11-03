<script setup lang="ts">
/** Card detail as its own page, laid out like the Foren Business Banking dashboard. */
import { computed, ref } from "vue";
import CardStatusBadge from "@/components/card/CardStatusBadge.vue";
import { usedBy } from "@/components/card/holder";
import NotFound from "@/components/create/NotFound.vue";
import PageHeader from "@/components/PageHeader.vue";
import { visibleCards } from "@/lib/permissions";
import { personById, useAppStore } from "@/stores/app";
import type { DialogKind } from "./card-detail";
import CardDialogs from "./CardDialogs.vue";
import CardPanel from "./CardPanel.vue";
import CardTabs from "./CardTabs.vue";

const props = defineProps<{ cardId: string }>();
const store = useAppStore();
const card = computed(() =>
  visibleCards(store.role, store.cards).find((c) => c.id === props.cardId),
);
const holder = computed(() =>
  card.value ? personById(card.value.holderId) : undefined,
);
const dialog = ref<DialogKind>(null);
</script>

<template>
  <NotFound v-if="!card" />
  <div v-else>
    <PageHeader>
      <template #title>
        {{ card.nickname }}
      </template>
      <template
        v-if="card.status !== 'active' || card.kind === 'emergency'"
        #badge
        ><CardStatusBadge :card="card" size="sm"
      /></template>
      <template #description>
        {{ card.companyCard ? `Company card · ${usedBy(card)}` : holder?.name }}
        · •• {{ card.last4
        }}{{ holder?.invited && !card.companyCard ? " · Invite pending" : "" }}
      </template>
    </PageHeader>
    <!-- Mercury layout: history and details on the left, the card panel on the right -->
    <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div class="order-2 min-w-0 lg:order-1">
        <CardTabs :card="card" />
      </div>
      <div class="order-1 lg:sticky lg:top-4 lg:order-2">
        <CardPanel :card="card" full @pick="(d) => (dialog = d)" />
      </div>
    </div>
    <CardDialogs
      :key="dialog ?? 'closed'"
      v-model:dialog="dialog"
      :card="card"
    />
  </div>
</template>
