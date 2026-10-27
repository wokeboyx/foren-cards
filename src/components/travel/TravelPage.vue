<script setup lang="ts">
/**
 * Spending abroad (Wise "Travel hub", adapted): pick a country and a card to see which balance pays,
 * what it costs, whether the card will work there, and a few tips. Read-only apart from trip dates.
 */
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import CardArt from "@/components/card/CardArt.vue";
import { nameOnCard } from "@/components/card/holder";
import CurrencyFlag from "@/components/CurrencyFlag.vue";
import PageHeader from "@/components/PageHeader.vue";
import Panel from "@/components/Panel.vue";
import SectionTitle from "@/components/SectionTitle.vue";
import { CURRENCY_NAME } from "@/domain/money";
import { countryByCode } from "@/fixtures/countries";
import { can, visibleCards } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";
import CountrySelect from "./CountrySelect.vue";
import PaysWith from "./PaysWith.vue";
import RateBox from "./RateBox.vue";
import Tips from "./Tips.vue";
import { useTravelPlan } from "./travel-insights";
import TripDates from "./TripDates.vue";
import WillItWork from "./WillItWork.vue";

const HOME = "NGN" as const;

const store = useAppStore();
const route = useRoute();
const router = useRouter();
const q = (k: string) => {
  const v = route.query[k];
  return (Array.isArray(v) ? v[0] : v) ?? null;
};
const cards = computed(() => visibleCards(store.role, store.cards).filter((c) => c.status !== "canceled" && c.kind !== "emergency"));
const country = computed(() => countryByCode(q("country")) ?? countryByCode("GB")!);
const card = computed(() => cards.value.find((c) => c.id === q("card")) ?? cards.value[0]);
const plan = useTravelPlan(card, () => country.value.currency, () => store.balances, HOME);

function setParam(k: string, v: string) {
  router.replace({ path: route.path, query: { ...route.query, [k]: v } });
}
</script>

<template>
  <div class="max-w-[1115px] space-y-6">
    <PageHeader title="Spending abroad" description="Rates, fees and which balance pays abroad." />

    <div class="grid gap-4 sm:grid-cols-2">
      <CountrySelect :model-value="country.code" @update:model-value="(c) => setParam('country', c)" />
      <div class="flex flex-col gap-2">
        <label for="travel-card" class="text-[14px] font-medium text-fg">Which card is going?</label>
        <select
          id="travel-card"
          :value="card?.id ?? ''"
          class="h-14 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus"
          @change="setParam('card', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="c in cards" :key="c.id" :value="c.id">{{ c.nickname }} •• {{ c.last4 }}</option>
        </select>
      </div>
    </div>

    <Panel v-if="!card || !plan" class="p-6 text-[14px] text-fg-2">You don’t have a card that can be used abroad.</Panel>
    <template v-else>
      <section class="flex flex-col items-center gap-3 rounded-[20px] bg-surface px-6 py-8 text-center">
        <CurrencyFlag :currency="country.currency" :size="48" />
        <h2 class="text-[24px] leading-[30px] font-semibold tracking-[-0.015em] text-fg">Spend like a local in {{ country.name }}</h2>
        <p class="text-[14px] text-fg-2">Charges there are in {{ CURRENCY_NAME[country.currency] }} ({{ country.currency }}).</p>
        <div class="w-full max-w-[360px]">
          <RateBox :local="country.currency" :home="HOME" :fee="plan.fee" />
        </div>
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <Panel class="space-y-4 p-5">
          <SectionTitle>Which balance pays</SectionTitle>
          <PaysWith :plan="plan" :local="country.currency" />
        </Panel>
        <div class="space-y-4">
          <Panel class="space-y-4 p-5">
            <div class="flex items-center gap-3">
              <CardArt :card="card" size="xs" />
              <div class="min-w-0">
                <SectionTitle>Will {{ card.nickname }} work there?</SectionTitle>
                <p class="truncate text-[12px] text-fg-3">{{ nameOnCard(card) }}</p>
              </div>
            </div>
            <WillItWork :card="card" :plan="plan" />
          </Panel>
          <TripDates v-if="can(store.role, 'edit', card)" :key="card.id" :card-id="card.id" :from="card.activeFrom" :until="card.activeUntil" />
        </div>
      </div>

      <Panel class="space-y-4 p-5">
        <SectionTitle>Tips for spending in {{ country.name }}</SectionTitle>
        <Tips :local="country.currency" :home="HOME" />
      </Panel>
    </template>
  </div>
</template>
