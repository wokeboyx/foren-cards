<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import CardsHeader from "@/components/cards/CardsHeader.vue";
import CardArt from "@/components/card/CardArt.vue";
import CardStatusBadge from "@/components/card/CardStatusBadge.vue";
import EmptyState from "@/components/EmptyState.vue";
import Panel from "@/components/Panel.vue";
import { COPY } from "@/content/copy";
import type { Card, Merchant } from "@/domain/types";
import { saveCard, unfreezeCard } from "@/services";
import { can, visibleCards } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";
import { cn } from "@/lib/utils";
import MerchantChecker from "./MerchantChecker.vue";

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const q = (k: string) => {
  const v = route.query[k];
  return (Array.isArray(v) ? v[0] : v) ?? undefined;
};
const usable = computed(() => visibleCards(store.role, store.cards).filter((c) => c.status !== "canceled"));
const selected = computed(() => usable.value.find((c) => c.id === q("card")) ?? usable.value[0]);

async function applyFix(card: Card, m: Merchant, fix: string) {
  try {
    if (fix === "unfreeze") await unfreezeCard(card.id);
    else {
      const p = card.permissions;
      await saveCard({
        ...card,
        permissions:
          fix === "allow_merchant"
            ? { ...p, blockedMerchantIds: p.blockedMerchantIds.filter((x) => x !== m.id), allowedMerchantIds: p.mode === "merchants" ? [...new Set([...p.allowedMerchantIds, m.id])] : p.allowedMerchantIds }
            : { ...p, blockedCategories: p.blockedCategories.filter((x) => x !== m.category), allowedCategories: p.mode === "categories" ? [...new Set([...p.allowedCategories, m.category])] : p.allowedCategories },
      });
    }
    toast(`${card.nickname} updated`);
  } catch {
    toast.error(COPY.saveFailure);
  }
}
</script>

<template>
  <div class="space-y-6">
    <CardsHeader tab="check" description="See if a card will work before you pay." />
    <Panel v-if="!selected">
      <EmptyState title="No cards to check" body="You need an active card to check a merchant." />
    </Panel>
    <div v-else class="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Panel class="p-3">
        <div id="card-pick" class="px-2 pt-1 pb-2 text-[12px] font-semibold tracking-[0.06em] text-fg-3 uppercase">Card to check</div>
        <div role="radiogroup" aria-labelledby="card-pick" class="space-y-1">
          <div v-for="c in usable" :key="c.id">
            <button
              role="radio"
              :aria-checked="c.id === selected.id"
              :class="
                cn(
                  'flex w-full items-center gap-3 rounded-[14px] px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus',
                  c.id === selected.id ? 'bg-subtle' : 'hover:bg-sunken'
                )
              "
              @click="router.replace({ path: '/cards/check-merchant', query: { card: c.id } })"
            >
              <CardArt :card="c" size="xs" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[14px] font-medium text-fg">{{ c.nickname }}</span>
                <span class="tnum text-[12px] text-fg-3">•• {{ c.last4 }}</span>
              </span>
              <CardStatusBadge v-if="c.status !== 'active'" :card="c" size="sm" />
            </button>
          </div>
        </div>
      </Panel>
      <Panel class="p-5 sm:p-6">
        <MerchantChecker
          :key="selected.id"
          :card="selected"
          :initial-merchant-id="q('merchant')"
          :alternatives="usable.filter((c) => c.status === 'active')"
          :can-fix="can(store.role, 'edit', selected)"
          @fix="(m, fix) => applyFix(selected, m, fix)"
        />
      </Panel>
    </div>
  </div>
</template>
