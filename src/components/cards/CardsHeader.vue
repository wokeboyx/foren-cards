<script setup lang="ts">
/** "Cards" title with an inline Create card action, and the Cards overview tabs (DS Segmented control). */
import { useRouter } from "vue-router";
import { RiAddLine } from "@/components/icons";
import PageHeader from "@/components/PageHeader.vue";
import LinkButton from "@/components/LinkButton.vue";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import { COPY } from "@/content/copy";
import { can } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";
import { CARDS_TABS, type CardsTab } from "./cards-header";

defineProps<{ tab: CardsTab; description?: string }>();
const store = useAppStore();
const router = useRouter();
const options = CARDS_TABS.map(({ value, label }) => ({ value, label }));
const go = (v: CardsTab) => router.push(CARDS_TABS.find((t) => t.value === v)!.href);
</script>

<template>
  <PageHeader title="Cards" :description="description">
    <template #actions>
      <LinkButton v-if="can(store.role, 'issue')" href="/cards/new" variant="primary" size="sm">
        <template #leadingIcon><RiAddLine /></template>
        {{ COPY.createCard }}
      </LinkButton>
      <LinkButton v-else href="/cards/request" variant="primary" size="sm">
        <template #leadingIcon><RiAddLine /></template>
        Request card
      </LinkButton>
    </template>
    <template #tabs>
      <ForenSegmentedControl size="lg" ariaLabel="Cards sections" :options="options" :model-value="tab" @update:model-value="go" />
    </template>
  </PageHeader>
</template>
