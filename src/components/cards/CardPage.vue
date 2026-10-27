<script setup lang="ts">
/** Card detail as its own page, laid out like the Foren Business Banking dashboard. */
import { computed, ref } from "vue";
import CardStatusBadge from "@/components/card/CardStatusBadge.vue";
import { usedBy } from "@/components/card/holder";
import NotFound from "@/components/create/NotFound.vue";
import PageHeader from "@/components/PageHeader.vue";
import { visibleCards } from "@/lib/permissions";
import { personById, useAppStore } from "@/stores/app";
import AboutCard from "./AboutCard.vue";
import type { DialogKind } from "./card-detail";
import CardDetailsPanel from "./CardDetailsPanel.vue";
import CardDialogs from "./CardDialogs.vue";
import CardSpend from "./CardSpend.vue";
import CardTabs from "./CardTabs.vue";

const props = defineProps<{ cardId: string }>();
const store = useAppStore();
const card = computed(() => visibleCards(store.role, store.cards).find((c) => c.id === props.cardId));
const holder = computed(() => (card.value ? personById(card.value.holderId) : undefined));
const dialog = ref<DialogKind>(null);
</script>

<template>
  <NotFound v-if="!card" />
  <div v-else>
    <PageHeader :title="card.nickname">
      <template v-if="card.status !== 'active' || card.kind === 'emergency'" #badge><CardStatusBadge :card="card" size="sm" /></template>
      <template #description>
        {{ card.companyCard ? `Company card · ${usedBy(card)}` : holder?.name }} · •• {{ card.last4 }}{{ holder?.invited && !card.companyCard ? " · Invite pending" : "" }}
      </template>
    </PageHeader>
    <div class="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_363px]">
      <div class="min-w-0 space-y-3">
        <CardSpend :card="card" @pick="(d) => (dialog = d)" />
        <CardTabs :card="card" @pick="(d) => (dialog = d)" />
      </div>
      <div class="space-y-3">
        <CardDetailsPanel :card="card" />
        <AboutCard :card="card" />
      </div>
    </div>
    <CardDialogs :key="dialog ?? 'closed'" v-model:dialog="dialog" :card="card" />
  </div>
</template>
