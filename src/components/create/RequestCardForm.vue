<script setup lang="ts">
/**
 * A team member asks for a card. Same focus layout as Create card (progress bar, live preview on the right),
 * so the request feels like the owner's create flow. Sending it adds a "Pending request" row to their card list.
 */
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { motion, useReducedMotion } from "motion-v";
import { RiArrowLeftLine, RiArrowRightLine, RiCloseLine, RiTimeLine } from "@/components/icons";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import CardArt from "@/components/card/CardArt.vue";
import LinkButton from "@/components/LinkButton.vue";
import { POLICY } from "@/config/policy";
import { COPY } from "@/content/copy";
import { PERIOD_LABEL, PERIOD_PHRASE } from "@/domain/labels";
import { format, parseAmount } from "@/domain/money";
import type { CardRequest, Currency, LimitPeriod } from "@/domain/types";
import { COMPANY, PEOPLE } from "@/fixtures/seed";
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { useAction } from "@/composables/useAction";
import { requestNewCard } from "@/services";
import { currentUserId, personById, useAppStore } from "@/stores/app";
import MerchantScope from "./MerchantScope.vue";
import NotAllowed from "./NotAllowed.vue";
import SummaryRow from "./SummaryRow.vue";

const STEPS = [
  { title: "What’s the card for?", desc: "Give it a name your team will recognise, and tell the account owner why you need it." },
  { title: "Where will you use it?", desc: "Choose whether it’s for one merchant or many. The account owner can change this when they approve." },
  { title: "How much will you spend?", desc: "Ask for the limit you expect to need. The account owner decides the final amount." },
];

const store = useAppStore();
const me = computed(() => personById(currentUserId(store.role)));
const owner = PEOPLE.find((p) => p.role === "owner");
const reduce = useReducedMotion();
const step = ref(0);
const pane = ref<"form" | "preview">("form");
const nickname = ref("");
const note = ref("");
const oneMerchant = ref(false);
const period = ref<LimitPeriod>("monthly");
const currency = ref<Currency>("USD");
const amountText = ref("500");
const errors = ref<{ nickname?: string; limit?: string }>({});
const sent = ref<CardRequest | null>(null);
const send = useAction(requestNewCard);
const { pending, error } = send;
const amount = computed(() => parseAmount(amountText.value, currency.value));
const notAllowed = computed(() => can(store.role, "issue") || store.role === "individual");

const preview = computed(() => ({
  design: "midnight" as const,
  nickname: nickname.value.trim() || "Card nickname",
  last4: "",
  kind: "standard" as const,
  status: "active" as const,
  permissions: { mode: oneMerchant.value ? ("first_merchant" as const) : ("anywhere" as const) },
}));

const scope = computed({
  get: () => (oneMerchant.value ? "one" : "many") as "one" | "many",
  set: (v) => (oneMerchant.value = v === "one"),
});

function check(n: number) {
  const e: { nickname?: string; limit?: string } = {};
  if (n === 0) {
    if (!nickname.value.trim()) e.nickname = "Give the card a name, like “Team travel”.";
    else if (nickname.value.trim().length > 40) e.nickname = "Use 40 characters or fewer.";
  }
  if (n === 2) {
    const max = POLICY.maxLimitMajor[currency.value];
    if (!amount.value || amount.value.minor <= 0) e.limit = "Enter an amount above zero, using numbers only.";
    else if (amount.value.minor > max * 100) e.limit = `The most you can ask for is ${format({ minor: max * 100, currency: currency.value })}.`;
  }
  errors.value = e;
  return Object.keys(e).length === 0;
}

// The primary action stays disabled until this step is complete.
const ready = computed(() =>
  step.value === 0
    ? nickname.value.trim().length > 0 && nickname.value.trim().length <= 40
    : step.value === 2
      ? !!amount.value && amount.value.minor > 0 && amount.value.minor <= POLICY.maxLimitMajor[currency.value] * 100
      : true
);

async function submit() {
  if (!check(step.value)) return;
  if (step.value < STEPS.length - 1) {
    step.value++;
    window.scrollTo({ top: 0 });
    return;
  }
  const r = await send.run({ nickname: nickname.value.trim(), note: note.value.trim() || undefined, oneMerchant: oneMerchant.value, design: "midnight", limit: { period: period.value, amount: amount.value! } });
  if (r.ok) sent.value = r.value;
}

function back() {
  errors.value = {};
  step.value--;
}

const periods = Object.keys(PERIOD_LABEL) as LimitPeriod[];
</script>

<template>
  <div v-if="notAllowed" class="mx-auto max-w-[640px] p-6">
    <NotAllowed body="Account owners create cards directly. Use Create card instead." />
  </div>

  <div v-else-if="sent" class="flex min-h-dvh flex-col items-center justify-center bg-subtle px-5 py-16 text-center">
    <RouterLink to="/cards" aria-label="Close" class="fixed top-5 right-5 grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus">
      <RiCloseLine class="size-5" aria-hidden="true" />
    </RouterLink>
    <motion.div :initial="reduce ? false : { opacity: 0, y: 24, scale: 0.94 }" :animate="{ opacity: 1, y: 0, scale: 1 }" class="relative">
      <CardArt :card="preview" size="md" :holder-name="me?.name" class="opacity-70" />
      <span class="absolute -top-2.5 -left-2">
        <ForenBadge color="orange">
          <template #leadingIcon><RiTimeLine aria-hidden="true" /></template>
          Pending request
        </ForenBadge>
      </span>
    </motion.div>
    <h1 class="mt-6 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg">Request sent</h1>
    <p class="mt-2 max-w-sm text-[14px] leading-[22px] text-fg-2">
      {{ owner?.name.split(" ")[0] }} will review it. It shows in your cards as a pending request, and we’ll let you know when it’s approved.
    </p>
    <div class="mt-6 flex flex-col gap-2 sm:flex-row">
      <LinkButton :href="`/cards?request=${sent.id}`">View request</LinkButton>
    </div>
  </div>

  <div v-else class="flex min-h-dvh flex-col lg:flex-row">
    <div :class="cn('flex min-w-0 flex-col lg:flex-1', pane === 'form' && 'flex-1')">
      <header class="flex h-16 items-center justify-between px-5 sm:px-8">
        <div class="flex items-center gap-2.5 text-[14px] font-medium text-fg">
          <img :src="asset('/foren-logo.svg')" alt="" width="22" height="22" />
          {{ COMPANY.name }}
        </div>
        <RouterLink to="/cards" aria-label="Close" class="grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus lg:hidden">
          <RiCloseLine class="size-5" aria-hidden="true" />
        </RouterLink>
      </header>
      <!-- Phones/tablets: switch between the form and the live preview (desktop shows both side by side). -->
      <div class="px-5 pb-2 sm:px-8 lg:hidden">
        <ForenSegmentedControl
          v-model="pane"
          size="lg"
          full-width
          aria-label="Show"
          :options="[
            { value: 'form', label: 'Details' },
            { value: 'preview', label: 'Preview' },
          ]"
        />
      </div>
      <form novalidate :class="cn('w-full flex-1 flex-col lg:flex', pane === 'form' ? 'flex' : 'hidden')" @submit.prevent="submit">
        <div class="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 pb-8 sm:px-8">
          <div
            role="progressbar"
            aria-label="Request card progress"
            :aria-valuemin="1"
            :aria-valuemax="STEPS.length"
            :aria-valuenow="step + 1"
            :aria-valuetext="`Step ${step + 1} of ${STEPS.length}`"
            class="mt-2 h-1 overflow-hidden rounded-full bg-line"
          >
            <div class="h-full rounded-full bg-[var(--color-foren-bg-button-primary)] transition-[width] duration-300" :style="{ width: `${((step + 1) / STEPS.length) * 100}%` }" />
          </div>
          <p class="mt-6 text-[13px] font-medium text-fg-3">Request a card · Step {{ step + 1 }} of {{ STEPS.length }}</p>
          <h1 class="mt-1 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg">{{ STEPS[step].title }}</h1>
          <p class="mt-1 mb-2 text-[14px] leading-[21px] text-fg-2">{{ STEPS[step].desc }}</p>

          <div class="space-y-4 py-4">
            <template v-if="step === 0">
              <ForenInput v-model="nickname" label="Card name" placeholder="e.g. Team travel" maxlength="40" :error="errors.nickname" description="Shown on the card and in your card list." />
              <div class="flex flex-col gap-2">
                <label for="req-note" class="text-[14px] font-medium text-fg">Why do you need it? <span class="font-normal text-fg-3">(optional)</span></label>
                <textarea
                  id="req-note"
                  v-model="note"
                  rows="3"
                  maxlength="500"
                  placeholder="e.g. Flights and hotels for the Abuja client visit."
                  class="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus"
                />
                <span class="tnum text-right text-[12px] text-fg-3">{{ note.length }}/500</span>
              </div>
            </template>
            <MerchantScope v-if="step === 1" v-model="scope" />
            <template v-if="step === 2">
              <div class="flex flex-col gap-2">
                <label for="req-period" class="text-[14px] font-medium text-fg">Limit type</label>
                <select id="req-period" v-model="period" class="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
                  <option v-for="p in periods" :key="p" :value="p">{{ PERIOD_LABEL[p] }}</option>
                </select>
              </div>
              <div class="grid grid-cols-[1fr_120px] gap-3">
                <ForenInput
                  v-model="amountText"
                  :label="`${PERIOD_LABEL[period]} limit`"
                  inputmode="decimal"
                  :error="errors.limit"
                  class="tnum"
                  :description="!errors.limit && amount ? `Up to ${format(amount)} ${PERIOD_PHRASE[period]}.` : undefined"
                />
                <div class="flex flex-col gap-2">
                  <label for="req-cur" class="text-[14px] font-medium text-fg">Currency</label>
                  <select id="req-cur" v-model="currency" class="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
                    <option v-for="c in POLICY.launchCurrencies" :key="c">{{ c }}</option>
                  </select>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Floating action bar (Figma "Floating button"): full content width, pinned to the bottom. -->
        <div class="sticky bottom-0 z-20 border-t border-line bg-surface px-5 py-3 sm:min-h-[84px] sm:px-8 sm:py-5">
          <p v-if="error" role="alert" class="mb-3 rounded-[14px] bg-error-subtle px-4 py-2.5 text-[13px] text-error">We couldn’t send your request. Nothing was sent. Try again.</p>
          <div class="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <ForenButton v-if="step < STEPS.length - 1" type="submit" size="sm" class="w-full sm:order-last sm:flex-1" :disabled="!ready">
              Continue
              <template #trailingIcon><RiArrowRightLine /></template>
            </ForenButton>
            <ForenButton v-else type="submit" size="sm" class="w-full sm:order-last sm:flex-1" :disabled="pending || !ready">
              {{ pending ? "Sending…" : error ? "Try again" : "Send request" }}
            </ForenButton>
            <ForenButton v-if="step > 0" type="button" variant="outline" size="sm" class="w-full sm:flex-1" @click="back">
              <template #leadingIcon><RiArrowLeftLine /></template>
              Back
            </ForenButton>
            <LinkButton v-else href="/cards" variant="outline" size="sm" class="w-full sm:flex-1">Cancel</LinkButton>
          </div>
        </div>
      </form>
    </div>

    <aside
      aria-label="Request summary"
      :class="
        cn(
          'mx-5 mt-2 mb-5 flex-1 rounded-[20px] bg-subtle sm:mx-8 lg:sticky lg:top-2 lg:m-2 lg:block lg:h-[calc(100dvh-16px)] lg:w-[44%] lg:max-w-[600px] lg:flex-none lg:overflow-y-auto',
          pane === 'preview' ? 'block' : 'hidden'
        )
      "
    >
      <div class="hidden h-16 items-center justify-end px-6 lg:flex">
        <RouterLink to="/cards" aria-label="Close" class="grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus">
          <RiCloseLine class="size-5" aria-hidden="true" />
        </RouterLink>
      </div>
      <div class="mx-auto flex max-w-[380px] flex-col items-center gap-5 px-6 py-8 lg:py-6">
        <CardArt :card="preview" size="lg" :holder-name="me?.name" :lock-text="oneMerchant ? 'Locks to its first merchant' : undefined" />
        <dl class="w-full divide-y divide-line rounded-[20px] bg-surface px-4 text-[13px] ring-1 ring-line">
          <SummaryRow label="Card name">{{ nickname.trim() || "—" }}</SummaryRow>
          <SummaryRow label="For">{{ me?.name }}</SummaryRow>
          <SummaryRow label="Merchants">{{ oneMerchant ? "One merchant" : "Many merchants" }}</SummaryRow>
          <SummaryRow label="Limit asked for">{{ amount && amount.minor > 0 ? `Up to ${format(amount)} ${PERIOD_PHRASE[period]}` : "—" }}</SummaryRow>
          <SummaryRow label="Goes to">{{ owner?.name }} (account owner)</SummaryRow>
        </dl>
        <p class="text-center text-[12px] leading-[17px] text-fg-3">{{ COPY.cardsEmpty.value }}</p>
      </div>
    </aside>
  </div>
</template>
