<script setup lang="ts">
import { h, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { RiArrowRightLine, RiSearchEyeLine } from "@/components/icons";
import ForenSearch from "@/components/ui/ForenSearch.vue";
import type { ForenSearchResult } from "@/components/ui/foren-search";
import CardArt from "@/components/card/CardArt.vue";
import MerchantLogo from "@/components/MerchantLogo.vue";
import { MERCHANTS } from "@/fixtures/merchants";
import { can, visibleCards } from "@/lib/permissions";
import { personById, useAppStore } from "@/stores/app";

const PAGES = [
  { label: "Cards", href: "/cards" },
  { label: "Subscriptions", href: "/subscriptions" },
  { label: "Create card", href: "/cards/new", cap: "issue" as const },
  { label: "Check a merchant", href: "/cards/check-merchant" },
  { label: "Requests", href: "/requests" },
  { label: "Global account", href: "/global-account", cap: "autofx" as const },
  { label: "Spending abroad", href: "/travel" },
];

/** Top-bar search (⌘K): jump to a card, page or merchant check. */
const router = useRouter();
const store = useAppStore();
const q = ref("");
const wrap = useTemplateRef<HTMLDivElement>("wrap");

function onKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    wrap.value?.querySelector("input")?.focus();
  }
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));

function search(raw: string): ForenSearchResult[] {
  const s = raw.trim().toLowerCase();
  if (!s) return [];
  const role = store.role;
  const cardHits = visibleCards(role, store.cards)
    .filter((c) => !c.archived && (c.nickname.toLowerCase().includes(s) || c.last4.includes(s) || personById(c.holderId)?.name.toLowerCase().includes(s)))
    .slice(0, 5)
    .map((c) => ({ value: `card:${c.id}`, label: `${c.nickname} •• ${c.last4}`, description: personById(c.holderId)?.name, icon: h(CardArt, { card: c, size: "xs" }) }));
  const pageHits = PAGES.filter((p) => (!p.cap || can(role, p.cap)) && p.label.toLowerCase().includes(s)).map((p) => ({
    value: `page:${p.href}`,
    label: p.label,
    description: "Go to page",
    icon: h(RiArrowRightLine, { class: "size-5 text-fg-3" }),
  }));
  const merchantHits = MERCHANTS.filter((m) => m.name.toLowerCase().includes(s))
    .slice(0, 3)
    .map((m) => ({ value: `merchant:${m.id}`, label: `Check ${m.name}`, description: "Will my card work here?", icon: h(MerchantLogo, { merchant: m, size: 28 }) }));
  return [...cardHits, ...pageHits, ...merchantHits];
}

function onSelect(r: ForenSearchResult) {
  q.value = "";
  const i = r.value.indexOf(":");
  const [kind, id] = [r.value.slice(0, i), r.value.slice(i + 1)];
  if (kind === "card") router.push(`/cards/${id}`);
  else if (kind === "page") router.push(id);
  else router.push(`/cards/check-merchant?merchant=${id}`);
}
</script>

<template>
  <div ref="wrap" class="w-full">
    <ForenSearch v-model="q" aria-label="Search cards or more" size="xs" placeholder="Search..." :on-search="search" @select="onSelect">
      <template #emptyState>
        <span class="flex items-center gap-2 text-[13px] text-fg-3"> <RiSearchEyeLine class="size-4" aria-hidden="true" /> No matches </span>
      </template>
    </ForenSearch>
  </div>
</template>
