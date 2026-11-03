<script setup lang="ts">
/** The tabs sit on the page, outside the white panels, as on the Global account page: History and Card details. */
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import type { Card } from "@/domain/types";
import { cn } from "@/lib/utils";
import CardDetailsTab from "./CardDetailsTab.vue";
import CardHistory from "./CardHistory.vue";

type TabKey = "history" | "details";

defineProps<{ card: Card }>();

const route = useRoute();
const initial = route.query.tab;
const tab = ref<TabKey>(initial === "details" ? initial : "history");
watch(
  () => route.query.tab,
  (v) => {
    if (v === "history" || v === "details") tab.value = v;
  },
);
const options = computed<{ value: TabKey; label: string }[]>(() => [
  { value: "history", label: "History" },
  { value: "details", label: "Card details" },
]);
const active = computed(() =>
  options.value.some((o) => o.value === tab.value) ? tab.value : "history",
);
</script>

<template>
  <section aria-label="Card activity and controls">
    <!-- Figma "Tab Item": 12 × 8 padding, 14/21 text, a 1px muted divider under each tab and a 2px dark indicator on the active one -->
    <div
      role="tablist"
      aria-label="Card sections"
      class="flex max-w-full items-start gap-2 overflow-x-auto"
    >
      <button
        v-for="o in options"
        :key="o.value"
        type="button"
        role="tab"
        :aria-selected="o.value === active"
        class="relative flex shrink-0 flex-col items-start outline-none focus-visible:ring-2 focus-visible:ring-focus"
        @click="tab = o.value"
      >
        <span
          :class="
            cn(
              'px-3 py-2 text-[14px] leading-[21px] whitespace-nowrap [font-feature-settings:\'calt\'_0]',
              o.value === active
                ? 'font-semibold tracking-[0.175px] text-[var(--color-foren-text-primary)]'
                : 'font-medium tracking-[0.14px] text-[var(--color-foren-text-tertiary)] hover:text-[var(--color-foren-text-primary)]',
            )
          "
          >{{ o.label }}</span
        >
        <span
          v-if="o.value === active"
          class="absolute bottom-0 left-0 h-0.5 w-full rounded-[2px] bg-[var(--color-foren-bg-button-primary)]"
          aria-hidden="true"
        />
        <span
          class="h-px w-full bg-[var(--color-foren-border-muted)]"
          aria-hidden="true"
        />
      </button>
    </div>
    <div
      class="mt-4"
      role="tabpanel"
      :aria-label="options.find((o) => o.value === active)?.label"
    >
      <div class="rounded-[20px] bg-surface px-6 py-5">
        <CardHistory v-if="active === 'history'" :card="card" />
        <CardDetailsTab v-if="active === 'details'" :card="card" />
      </div>
    </div>
  </section>
</template>
