<script setup lang="ts">
import { computed, h, ref } from "vue";
import { RiStore2Line } from "@/components/icons";
import ForenSearch from "@/components/ui/ForenSearch.vue";
import type { ForenSearchResult } from "@/components/ui/foren-search";
import ForenSpinner from "@/components/ui/ForenSpinner.vue";
import MerchantLogo from "@/components/MerchantLogo.vue";
import ErrorState from "@/components/ErrorState.vue";
import { checkMerchant, type CompatResult } from "@/domain/compatibility";
import { CATEGORY_LABEL } from "@/domain/labels";
import type { Card, Merchant } from "@/domain/types";
import { MERCHANTS } from "@/fixtures/merchants";
import { call } from "@/services/mock/call";
import { cn } from "@/lib/utils";
import type { CompatFix } from "./merchant-checker";
import VerdictPanel from "./VerdictPanel.vue";

const props = withDefaults(
  defineProps<{
    card: Card;
    /** Other cards the user could use instead when the verdict is "Won't work". */
    alternatives?: Card[];
    /** Apply the suggested rule change (e.g. allow this merchant). Listen with `@fix`. */
    onFix?: (merchant: Merchant, fix: CompatFix) => void;
    canFix?: boolean;
    compact?: boolean;
    initialMerchantId?: string;
  }>(),
  { alternatives: () => [] }
);

/** An unknown merchant typed by the user — we have no history for it. */
function unknownMerchant(name: string): Merchant {
  return { id: `unknown:${name.toLowerCase()}`, name, category: "office", billingCurrency: "USD", mark: name.slice(0, 2), tint: "#87827e", network: { kind: "unknown" } };
}

const query = ref("");
const merchant = ref<Merchant | null>(MERCHANTS.find((m) => m.id === props.initialMerchantId) ?? null);
const status = ref<"idle" | "searching" | "done" | "error">(props.initialMerchantId ? "done" : "idle");
let run = 0;

function check(m: Merchant) {
  const id = ++run;
  merchant.value = m;
  status.value = "searching";
  call(() => true, { kind: "load" })
    .then(() => id === run && (status.value = "done"))
    .catch(() => id === run && (status.value = "error"));
}

function search(raw: string): ForenSearchResult[] {
  const q = raw.trim().toLowerCase();
  if (!q) return [];
  const hits = MERCHANTS.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6);
  const list: ForenSearchResult[] = hits.map((m) => ({
    value: m.id,
    label: m.name,
    description: CATEGORY_LABEL[m.category],
    icon: h(MerchantLogo, { merchant: m, size: 28 }),
  }));
  if (!hits.some((m) => m.name.toLowerCase() === q))
    list.push({ value: `unknown:${raw.trim()}`, label: `Check “${raw.trim()}”`, description: "Not in our merchant list", icon: h(RiStore2Line, { class: "size-5 text-fg-3" }) });
  return list;
}

function onSelect(r: ForenSearchResult) {
  const m = r.value.startsWith("unknown:") ? unknownMerchant(r.value.slice(8)) : MERCHANTS.find((x) => x.id === r.value)!;
  check(m);
  query.value = "";
}

const result = computed<CompatResult | null>(() => (merchant.value ? checkMerchant(props.card, merchant.value) : null));
const alts = computed(() => {
  const m = merchant.value;
  return m && result.value?.verdict === "wont_work" ? props.alternatives.filter((c) => c.id !== props.card.id && checkMerchant(c, m).verdict !== "wont_work") : [];
});
const fix = computed(() => {
  const r = result.value;
  const m = merchant.value;
  if (!props.canFix || !props.onFix || !r || !m || r.card.ok || !r.card.fix) return undefined;
  const f = r.card.fix;
  const onFix = props.onFix;
  return () => onFix(m, f);
});
</script>

<template>
  <div :class="cn('space-y-4', compact && 'space-y-3')">
    <ForenSearch v-model="query" aria-label="Search for a merchant" placeholder="Search merchants, e.g. Figma" :on-search="search" @select="onSelect">
      <template #emptyState><span class="text-[13px] text-fg-3">Type a merchant name</span></template>
    </ForenSearch>

    <p v-if="status === 'idle' && !compact" class="text-[13px] leading-[18px] text-fg-3">
      We’ll check what we know about the merchant and this card’s own rules. Results are estimates, not guarantees.
    </p>
    <div v-if="status === 'searching'" class="flex items-center gap-3 rounded-[16px] bg-subtle px-4 py-4 text-[14px] text-fg-2" role="status">
      <ForenSpinner size="sm" aria-label="Checking" />
      Checking {{ merchant?.name }}…
    </div>
    <div v-if="status === 'error'" class="rounded-[16px] bg-subtle">
      <ErrorState message="We couldn’t check this merchant. Try again." class="py-6" @retry="merchant && check(merchant)" />
    </div>
    <VerdictPanel v-if="status === 'done' && merchant && result" :merchant="merchant" :result="result" :alternatives="alts" :on-fix="fix" />
  </div>
</template>
