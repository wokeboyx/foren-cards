<script setup lang="ts">
import { computed, ref } from "vue";
import { RiAddLine, RiExchangeDollarLine, RiPlaneLine, RiPlayLine } from "@/components/icons";
import { toast } from "vue-sonner";
import NotAllowed from "@/components/create/NotAllowed.vue";
import EmptyState from "@/components/EmptyState.vue";
import ErrorState from "@/components/ErrorState.vue";
import LinkButton from "@/components/LinkButton.vue";
import LoadingRows from "@/components/LoadingRows.vue";
import Money from "@/components/Money.vue";
import PageHeader from "@/components/PageHeader.vue";
import Panel from "@/components/Panel.vue";
import ForenAccountWallet from "@/components/ui/ForenAccountWallet.vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { useLoad } from "@/composables/useLoad";
import { COPY } from "@/content/copy";
import { CURRENCY_NAME, format, formatRate, rate } from "@/domain/money";
import type { GoalType } from "@/domain/types";
import { can } from "@/lib/permissions";
import { call } from "@/services/mock/call";
import { useAppStore } from "@/stores/app";
import { FLAGS, GOAL_TYPE_IDS, GOAL_TYPES } from "./global-account";
import GoalCard from "./GoalCard.vue";
import GoalEditor from "./GoalEditor.vue";

const store = useAppStore();
const { status, retry } = useLoad("global");
const editing = ref<GoalType | "choose" | null>(null);
const running = ref(false);

const affected = computed(() => new Set(store.goals.flatMap((g) => [g.currency, g.counterCurrency])));
// Reads rates too, so the order updates when demo rates move.
const sorted = computed(() => (void store.rates, [...store.balances].sort((a, b) => b.available.minor / rate("USD", b.currency) - a.available.minor / rate("USD", a.currency))));
const accounts = computed(() =>
  sorted.value
    .filter((b) => FLAGS[b.currency])
    .slice(0, 3)
    .map((b) => ({ label: `${b.currency} account balance`, amount: format(b.available), flagSrc: FLAGS[b.currency]! }))
);
const usdRate = (c: Parameters<typeof rate>[1]) => (void store.rates, formatRate("USD", c, rate("USD", c)));

async function runCheck() {
  running.value = true;
  try {
    const n = await call(() => store.runAutoFx());
    toast(n ? `${n} ${n === 1 ? "goal" : "goals"} took action` : "No goals needed to act");
  } catch {
    toast.error("We couldn’t run the check. Nothing was converted. Try again.");
  } finally {
    running.value = false;
  }
}
const viewAll = () => document.getElementById("balances")?.scrollIntoView({ behavior: "smooth" });
</script>

<template>
  <NotAllowed v-if="!can(store.role, 'autofx')" body="Only the account owner and finance lead can see the Global account." />
  <div v-else class="space-y-6">
    <PageHeader title="Global account" description="Balances your cards pay from.">
      <template #actions>
        <LinkButton href="/travel" variant="outline" size="xxs">
          <template #leadingIcon><RiPlaneLine /></template>
          Spending abroad
        </LinkButton>
      </template>
    </PageHeader>

    <Panel v-if="status === 'loading'"><LoadingRows :rows="4" /></Panel>
    <Panel v-if="status === 'error'"><ErrorState @retry="retry" /></Panel>
    <template v-if="status === 'ready'">
      <Panel class="grid gap-6 p-5 sm:p-6 lg:grid-cols-[356px_1fr] lg:items-center">
        <div class="mx-auto hidden overflow-hidden sm:block">
          <ForenAccountWallet :accounts="accounts" :more-count="store.balances.length - 3" @view-all="viewAll" />
        </div>
        <ul id="balances" class="divide-y divide-line">
          <li v-for="b in store.balances" :key="b.currency" class="flex items-center gap-3 py-3">
            <span class="grid size-9 place-items-center rounded-full bg-subtle text-[12px] font-bold text-fg-2">{{ b.currency }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 text-[14px] font-medium text-fg">
                {{ CURRENCY_NAME[b.currency] }}
                <ForenBadge v-if="affected.has(b.currency)" size="sm" color="primary">
                  <template #leadingIcon><RiExchangeDollarLine aria-hidden="true" /></template>
                  AutoFX
                </ForenBadge>
              </div>
              <div v-if="b.currency !== 'USD'" class="tnum text-[12px] text-fg-3">{{ usdRate(b.currency) }}</div>
            </div>
            <Money :value="b.available" class="text-[15px] font-semibold text-fg" />
          </li>
        </ul>
      </Panel>

      <section class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-[20px] leading-[26px] font-semibold tracking-[-0.01em] text-fg">AutoFX goals</h2>
          <div v-if="store.goals.length > 0" class="flex flex-wrap gap-2">
            <ForenButton size="sm" variant="outline" :disabled="running" @click="runCheck">
              <template #leadingIcon><RiPlayLine /></template>
              {{ running ? "Checking…" : "Run goal check (demo)" }}
            </ForenButton>
            <ForenButton v-if="store.role === 'owner'" size="sm" @click="editing = 'choose'">
              <template #leadingIcon><RiAddLine /></template>
              New goal
            </ForenButton>
          </div>
        </div>
        <Panel v-if="store.goals.length === 0">
          <EmptyState :title="COPY.autoFxEmpty.title" :body="COPY.autoFxEmpty.body">
            <template #icon><RiExchangeDollarLine /></template>
            <div v-if="store.role === 'owner'" class="mt-6 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-3">
              <button
                v-for="t in GOAL_TYPE_IDS"
                :key="t"
                class="rounded-[18px] border border-line p-4 text-left outline-none hover:bg-sunken focus-visible:ring-2 focus-visible:ring-focus"
                @click="editing = t"
              >
                <span class="text-fg-2 [&_svg]:size-5" aria-hidden="true"><component :is="GOAL_TYPES[t].icon" /></span>
                <span class="mt-2 block text-[14px] font-semibold text-fg">{{ GOAL_TYPES[t].title }}</span>
                <span class="mt-1 block text-[13px] leading-[18px] text-fg-2">{{ GOAL_TYPES[t].line }}</span>
              </button>
            </div>
            <p v-else class="mt-4 text-[13px] text-fg-3">The account owner can set up currency goals.</p>
          </EmptyState>
        </Panel>
        <div v-else class="grid gap-3 md:grid-cols-2">
          <GoalCard v-for="g in store.goals" :key="g.id" :goal="g" :can-edit="store.role === 'owner'" />
        </div>
      </section>
    </template>

    <GoalEditor :open="editing !== null" :initial-type="editing === 'choose' ? null : editing" @update:open="(o) => !o && (editing = null)" />
  </div>
</template>
