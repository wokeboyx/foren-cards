<script setup lang="ts">
// One foren.co section with three interactive views. Each panel keeps its state while you switch tabs.
import { ref } from "vue";
import { cn } from "@/lib/utils";
import ExchangePanel from "./ExchangePanel.vue";
import PaymentLinkPanel from "./PaymentLinkPanel.vue";
import QuotePanel from "./QuotePanel.vue";

const TABS = [
  { key: "quote", label: "Quote on WhatsApp", short: "WhatsApp quote", Panel: QuotePanel },
  { key: "link", label: "Payment link", short: "Payment link", Panel: PaymentLinkPanel },
  { key: "rate", label: "Exchange rate", short: "Rates", Panel: ExchangePanel },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const tab = ref<TabKey>("quote");
const refs: Record<string, HTMLButtonElement | null> = {};

function onKey(e: KeyboardEvent, i: number) {
  const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : null;
  if (next === null) return;
  e.preventDefault();
  const t = TABS[(next + TABS.length) % TABS.length];
  tab.value = t.key;
  refs[t.key]?.focus();
}
</script>

<template>
  <section aria-label="Try Foren" class="bg-white px-4 py-16 sm:px-6 lg:py-24">
    <div class="mx-auto max-w-[1154px]">
      <div role="tablist" aria-label="Try Foren" class="mb-12 grid w-full grid-cols-3 gap-1 rounded-full bg-[#f2f1ef] p-1 sm:inline-flex sm:w-auto lg:mb-16">
        <button
          v-for="(t, i) in TABS"
          :key="t.key"
          :ref="(el) => (refs[t.key] = el as HTMLButtonElement | null)"
          role="tab"
          :id="`tab-${t.key}`"
          :aria-controls="`panel-${t.key}`"
          :aria-selected="tab === t.key"
          :tabindex="tab === t.key ? 0 : -1"
          :aria-label="t.label"
          :class="
            cn(
              'h-10 min-w-0 rounded-full px-2 text-[13px] font-semibold whitespace-nowrap sm:px-5 sm:text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30',
              tab === t.key ? 'bg-white text-[#2f2d2b] shadow-[0_1px_3px_rgba(23,18,13,0.12)]' : 'text-[#6b6661] hover:text-[#2f2d2b]'
            )
          "
          @click="tab = t.key"
          @keydown="onKey($event, i)"
        >
          <span class="sm:hidden">{{ t.short }}</span>
          <span class="hidden sm:inline">{{ t.label }}</span>
        </button>
      </div>
      <div v-for="t in TABS" :key="t.key" role="tabpanel" :id="`panel-${t.key}`" :aria-labelledby="`tab-${t.key}`" :hidden="tab !== t.key">
        <component :is="t.Panel" />
      </div>
    </div>
  </section>
</template>
