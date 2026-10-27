<script setup lang="ts">
/**
 * Create / edit card as a full-screen focus view (Mercury layout): section labels on the left,
 * fields on the right, and a tinted live preview + summary that doubles as the review (AC 2.1).
 */
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useReducedMotion } from "motion-v";
import { RiAddLine, RiArrowLeftLine, RiArrowRightLine, RiCloseLine, RiDeleteBinLine, RiSave3Line, RiSearchEyeLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import ForenToggle from "@/components/ui/ForenToggle.vue";
import LinkButton from "@/components/LinkButton.vue";
import CardArt from "@/components/card/CardArt.vue";
import { lockText } from "@/components/card/status-badge";
import { DESIGNS } from "@/components/card/designs";
import { permissionSentence } from "@/components/card/funding-path";
import { nameOnCard, usedBy } from "@/components/card/holder";
import MerchantChecker from "@/components/merchant/MerchantChecker.vue";
import type { CompatFix } from "@/components/merchant/merchant-checker";
import { POLICY } from "@/config/policy";
import { COPY } from "@/content/copy";
import { DESIGN_LABEL, PERIOD_LABEL, PERIOD_PHRASE, strategyLabel } from "@/domain/labels";
import { format, parseAmount } from "@/domain/money";
import type { Card, CardDesign, CardDraft, Currency, FundingConfig, LimitPeriod, Merchant, PermissionConfig } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { asset } from "@/lib/base-path";
import { visibleCards } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAction } from "@/composables/useAction";
import { deleteCardDraft, issueCards, newCardDraft, randomLast4, saveCard, saveCardDraft } from "@/services";
import { personById, useAppStore } from "@/stores/app";
import CardCreated from "./CardCreated.vue";
import ChoiceCard from "./ChoiceCard.vue";
import FormRow from "./FormRow.vue";
import FundingEditor from "./FundingEditor.vue";
import HolderPicker from "./HolderPicker.vue";
import PermissionsEditor from "./PermissionsEditor.vue";
import SummaryRow from "./SummaryRow.vue";
import { expiryFromYears, expiryLabel, STEPS, type CardFormErrors as Errors } from "./card-form";

const props = defineProps<{ mode: "create" | "edit"; initial?: Card; prefill?: Partial<Card>; fromDraft?: CardDraft }>();

const router = useRouter();
const store = useAppStore();
const draft = ref<Card>(props.initial ?? props.fromDraft?.card ?? { ...newCardDraft(""), ...props.prefill });
const amountText = ref(props.initial ? String(props.initial.limit.amount.minor / 100) : (props.fromDraft?.amountText ?? "5000"));
const pane = ref<"form" | "preview">("form");
/** Bulk create (Revolut "Name company cards"): extra card names that get the same settings. */
const extraNames = ref<string[]>(props.fromDraft?.names ?? []);
const draftId = props.fromDraft?.id ?? `d_${Math.random().toString(36).slice(2, 8)}`;
const saveDraft = useAction(saveCardDraft);
const periodOn = ref(!!(props.fromDraft?.card.activeFrom || props.fromDraft?.card.activeUntil));
const years = ref<number>(props.fromDraft?.years ?? 3);
const stepped = props.mode === "create";
const step = ref(props.fromDraft?.step ?? 0);
const show = (i: number) => !stepped || step.value === i;
const heading = useTemplateRef<HTMLHeadingElement>("heading");
// Move focus to the new step's heading so screen readers announce it (not on first load).
watch(step, () => nextTick(() => heading.value?.focus({ preventScroll: true })));
const errors = ref<Errors>({});
const done = ref<Card[] | null>(null);
const checkerOpen = ref(false);
const issue = useAction(issueCards);
const save = useAction(saveCard);
const reduce = useReducedMotion();
const closeHref = computed(() => (props.mode === "edit" ? `/cards/${draft.value.id}` : "/cards"));

const set = (patch: Partial<Card>) => (draft.value = { ...draft.value, ...patch });
const holder = computed(() => personById(draft.value.holderId));
const amount = computed(() => parseAmount(amountText.value, draft.value.limit.amount.currency));
const expiry = computed(() => (props.mode === "create" ? expiryFromYears(years.value) : draft.value.expiry));
const limitSentence = computed(() => (amount.value && amount.value.minor > 0 ? `Up to ${format(amount.value)} ${PERIOD_PHRASE[draft.value.limit.period]}` : null));

function computeErrors(): Errors {
  const d = draft.value;
  const a = amount.value;
  const e: Errors = {};
  if (!d.nickname.trim()) e.nickname = "Give the card a name so your team can recognise it.";
  else if (d.nickname.trim().length > 40) e.nickname = "Use 40 characters or fewer.";
  if (!d.holderId) e.holderId = d.companyCard ? "Choose at least one person to use and manage this card." : "Choose who will use this card, or add someone who isn’t on Foren.";
  const max = POLICY.maxLimitMajor[d.limit.amount.currency];
  if (!amountText.value.trim()) e.limit = "Enter a spending limit.";
  else if (!a) e.limit = "Enter an amount using numbers only, like 2,500.00.";
  else if (a.minor <= 0) e.limit = "The limit must be more than zero.";
  else if (a.minor > max * 100) e.limit = `The most you can set is ${format({ minor: max * 100, currency: a.currency })}.`;
  if (d.permissions.mode === "merchants" && !d.permissions.allowedMerchantIds.length) e.permissions = "Add at least one approved merchant, or choose another option.";
  if (d.permissions.mode === "categories" && !d.permissions.allowedCategories.length) e.permissions = "Choose at least one allowed category, or choose another option.";
  if (extraNames.value.some((n) => !n.trim())) e.nickname = "Give every card a name, or remove the empty one.";
  if (periodOn.value && d.activeFrom && d.activeUntil && d.activeUntil < d.activeFrom) e.limit = "The spending period must end on or after it starts.";
  return e;
}

// The primary action stays disabled until this step (or, when editing, the whole form) is complete.
const ready = computed(() => {
  const pendingErrors = computeErrors();
  return stepped ? STEPS[step.value].fields.every((k) => !pendingErrors[k]) : Object.keys(pendingErrors).length === 0;
});

const top = () => window.scrollTo({ top: 0, behavior: reduce.value ? "auto" : "smooth" });

/** Stepped create: check only the current step's answers before moving on. */
function next() {
  const all = computeErrors();
  const mine: Errors = {};
  for (const k of STEPS[step.value].fields) if (all[k]) mine[k] = all[k];
  errors.value = mine;
  if (Object.keys(mine).length) return;
  step.value++;
  top();
}

function validate(): Card | null {
  const e = computeErrors();
  errors.value = e;
  const first = Object.keys(e)[0] as keyof Errors | undefined;
  if (first && stepped) {
    step.value = STEPS.findIndex((x) => x.fields.includes(first));
    top();
    return null;
  }
  if (first) {
    const target = first === "nickname" || first === "holderId" ? "basics" : first === "limit" ? "limits" : "controls";
    document.getElementById(`section-${target}`)?.scrollIntoView({ behavior: reduce.value ? "auto" : "smooth", block: "start" });
    return null;
  }
  const d = draft.value;
  return {
    ...d,
    nickname: d.nickname.trim(),
    limit: { ...d.limit, amount: amount.value! },
    expiry: expiry.value,
    activeFrom: periodOn.value ? d.activeFrom || undefined : undefined,
    activeUntil: periodOn.value ? d.activeUntil || undefined : undefined,
  };
}

async function submit() {
  const v = validate();
  if (!v) return;
  draft.value = v;
  if (props.mode === "create") {
    const all = [v, ...extraNames.value.map((n) => ({ ...v, id: `c_${Math.random().toString(36).slice(2, 9)}`, last4: randomLast4(), nickname: n.trim() }))];
    if ((await issue.run(all)).ok) {
      deleteCardDraft(draftId);
      done.value = all;
    }
  } else if ((await save.run(v)).ok) {
    // Shown on the card page (app layout), whose toaster sits bottom-center.
    toast("Changes saved", { position: "bottom-center" });
    router.push(`/cards/${v.id}`);
  }
}

function onSubmit() {
  if (stepped && step.value < STEPS.length - 1) next();
  else submit();
}

function another() {
  draft.value = newCardDraft("");
  extraNames.value = [];
  periodOn.value = false;
  amountText.value = "5000";
  years.value = 3;
  step.value = 0;
  errors.value = {};
  done.value = null;
}

function back() {
  errors.value = {};
  step.value--;
  top();
}

async function saveForLater() {
  const r = await saveDraft.run({ id: draftId, savedAt: new Date().toISOString(), step: step.value, card: draft.value, names: extraNames.value, amountText: amountText.value, years: years.value });
  if (r.ok) {
    toast("Draft saved. Find it in your card list.", { position: "bottom-center" });
    router.push("/cards");
  }
}

function applyFix(m: Merchant, fix: CompatFix) {
  const p = draft.value.permissions;
  if (fix === "allow_merchant")
    set({
      permissions: {
        ...p,
        blockedMerchantIds: p.blockedMerchantIds.filter((x) => x !== m.id),
        allowedMerchantIds: p.mode === "merchants" && !p.allowedMerchantIds.includes(m.id) ? [...p.allowedMerchantIds, m.id] : p.allowedMerchantIds,
      },
    });
  if (fix === "allow_category")
    set({
      permissions: {
        ...p,
        blockedCategories: p.blockedCategories.filter((x) => x !== m.category),
        allowedCategories: p.mode === "categories" && !p.allowedCategories.includes(m.category) ? [...p.allowedCategories, m.category] : p.allowedCategories,
      },
    });
  toast(`Updated permissions for ${m.name}. Review the change above.`);
}

const permissions = computed({ get: () => draft.value.permissions, set: (permissions: PermissionConfig) => set({ permissions }) });
const funding = computed({ get: () => draft.value.funding, set: (funding: FundingConfig) => set({ funding }) });
const nickname = computed({ get: () => draft.value.nickname, set: (nickname: string) => set({ nickname }) });
const period = computed({ get: () => draft.value.limit.period, set: (p: LimitPeriod) => set({ limit: { ...draft.value.limit, period: p } }) });
const currency = computed({
  get: () => draft.value.limit.amount.currency,
  set: (c: Currency) => set({ limit: { ...draft.value.limit, amount: { ...draft.value.limit.amount, currency: c } } }),
});
const activeFrom = computed({ get: () => draft.value.activeFrom ?? "", set: (v: string) => set({ activeFrom: v || undefined }) });
const activeUntil = computed({ get: () => draft.value.activeUntil ?? "", set: (v: string) => set({ activeUntil: v || undefined }) });

const others = computed(() => visibleCards(store.role, store.cards).filter((c) => c.status === "active" && c.id !== draft.value.id));
const pending = computed(() => issue.pending.value || save.pending.value);
const failed = computed(() => issue.error.value || save.error.value);
const periods = Object.keys(PERIOD_LABEL) as LimitPeriod[];
const designs = Object.keys(DESIGNS) as CardDesign[];
const EXPIRY_CHOICES: [number, string, string][] = [
  [3, "In 3 years", "The default. Good for cards you’ll keep using."],
  [2, "In 2 years", ""],
  [1, "In 1 year", "For short projects or temporary spend."],
];
const issuePending = issue.pending;
const issueError = issue.error;
const savePending = save.pending;
const saveError = save.error;
const draftPending = saveDraft.pending;
</script>

<template>
  <CardCreated v-if="done" :cards="done" @another="another" />

  <div v-else class="flex min-h-dvh flex-col lg:flex-row">
    <!-- Form pane -->
    <div :class="cn('flex min-w-0 flex-col lg:flex-1', pane === 'form' && 'flex-1')">
      <header class="flex h-16 items-center justify-between px-5 sm:px-8">
        <div class="flex items-center gap-2.5 text-[14px] font-medium text-fg">
          <img :src="asset('/foren-logo.svg')" alt="" width="22" height="22" />
          {{ COMPANY.name }}
        </div>
        <RouterLink :to="closeHref" aria-label="Close" class="grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus lg:hidden">
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

      <form novalidate :class="cn('w-full flex-1 flex-col lg:flex', pane === 'form' ? 'flex' : 'hidden')" @submit.prevent="onSubmit">
        <div class="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 pb-8 sm:px-8">
          <template v-if="stepped">
            <!-- One progress bar for the create flow. -->
            <div
              role="progressbar"
              aria-label="Create card progress"
              :aria-valuemin="1"
              :aria-valuemax="STEPS.length"
              :aria-valuenow="step + 1"
              :aria-valuetext="`Step ${step + 1} of ${STEPS.length}`"
              class="mt-2 h-1 overflow-hidden rounded-full bg-line"
            >
              <div class="h-full rounded-full bg-[var(--color-foren-bg-button-primary)] transition-[width] duration-300" :style="{ width: `${((step + 1) / STEPS.length) * 100}%` }" />
            </div>
            <p class="mt-6 text-[13px] font-medium text-fg-3">Step {{ step + 1 }} of {{ STEPS.length }}</p>
            <h1 ref="heading" class="mt-1 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg outline-none" tabindex="-1">
              {{ STEPS[step].title }}
            </h1>
            <p class="mt-1 mb-2 text-[14px] leading-[21px] text-fg-2">{{ STEPS[step].desc }}</p>
          </template>
          <template v-else>
            <h1 class="mt-4 mb-2 text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg">{{ `Edit ${initial?.nickname}` }}</h1>
            <p class="mb-4 text-[14px] text-fg-2">Changes apply to new charges as soon as you save.</p>
          </template>
          <p v-if="Object.keys(errors).length > 0" role="alert" class="mb-2 rounded-[14px] bg-error-subtle px-4 py-2.5 text-[13px] font-medium text-error">Check the highlighted fields.</p>

          <FormRow v-if="show(0)" id="basics" label="Card for" :stepped="stepped">
            <HolderPicker :card="draft" :error="errors.holderId" :disabled="mode === 'edit'" :hide-title="stepped" @change="set" />
            <ForenInput
              v-model="nickname"
              label="Nickname"
              placeholder="e.g. Ops travel"
              maxlength="60"
              :error="errors.nickname"
              description="Shown on the card and in your card list."
            />
            <div v-if="mode === 'create'" class="space-y-2">
              <div v-for="(n, i) in extraNames" :key="i" class="flex items-end gap-2">
                <ForenInput
                  container-class-name="flex-1"
                  :label="`Card ${i + 2} nickname`"
                  placeholder="e.g. AWS"
                  :model-value="n"
                  maxlength="60"
                  :autofocus="!n"
                  @update:model-value="(v) => (extraNames = extraNames.map((x, j) => (j === i ? String(v ?? '') : x)))"
                />
                <ForenButton type="button" variant="ghost" size="sm" :aria-label="`Remove card ${i + 2}`" class="mb-0.5 px-3" @click="extraNames = extraNames.filter((_, j) => j !== i)">
                  <template #leadingIcon><RiDeleteBinLine /></template>
                </ForenButton>
              </div>
              <button
                v-if="extraNames.length < 9"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full px-1 py-1 text-[13px] font-semibold text-fg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-focus"
                @click="extraNames = [...extraNames, '']"
              >
                <RiAddLine class="size-4" aria-hidden="true" />
                Add another card with the same settings
              </button>
              <p v-if="extraNames.length > 0" class="text-[12px] leading-[17px] text-fg-3">Each card gets its own number. Handy for giving each subscription or supplier its own card.</p>
            </div>
          </FormRow>

          <FormRow v-if="show(1)" id="controls" label="Spend controls" :stepped="stepped">
            <PermissionsEditor v-model="permissions" :error="errors.permissions" />
            <div class="rounded-[16px] bg-subtle p-4">
              <button
                type="button"
                :aria-expanded="checkerOpen"
                class="flex w-full items-center gap-2 text-left text-[14px] font-semibold text-fg outline-none focus-visible:underline"
                @click="checkerOpen = !checkerOpen"
              >
                <RiSearchEyeLine class="size-[18px]" aria-hidden="true" />
                Check a merchant <span class="font-normal text-fg-3">(optional)</span>
              </button>
              <div v-if="checkerOpen" class="mt-3">
                <MerchantChecker :card="{ ...draft, status: 'active' }" :alternatives="others" compact can-fix @fix="applyFix" />
              </div>
            </div>
          </FormRow>

          <FormRow v-if="show(2)" label="Funding" :stepped="stepped">
            <FundingEditor v-model="funding" />
          </FormRow>

          <FormRow v-if="show(3)" id="limits" label="Spending limit" :stepped="stepped" sub>
            <div class="flex flex-col gap-2">
              <label for="limit-type" class="text-[14px] font-medium text-fg">Limit type</label>
              <select id="limit-type" v-model="period" class="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
                <option v-for="p in periods" :key="p" :value="p">{{ PERIOD_LABEL[p] }}</option>
              </select>
            </div>
            <div class="grid grid-cols-[1fr_120px] gap-3">
              <ForenInput
                v-model="amountText"
                :label="`${PERIOD_LABEL[draft.limit.period]} spending limit`"
                inputmode="decimal"
                :error="errors.limit"
                class="tnum"
                :description="!errors.limit ? (limitSentence ? `${limitSentence}.` : 'Enter an amount.') : undefined"
              />
              <div class="flex flex-col gap-2">
                <label for="limit-cur" class="text-[14px] font-medium text-fg">Currency</label>
                <select id="limit-cur" v-model="currency" class="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
                  <option v-for="c in POLICY.launchCurrencies" :key="c">{{ c }}</option>
                </select>
              </div>
            </div>
          </FormRow>

          <FormRow v-if="mode === 'create' && show(3)" label="Expiry" :stepped="stepped" sub>
            <fieldset>
              <legend class="mb-2 text-[14px] font-medium text-fg">When should the card expire?</legend>
              <div class="grid gap-2">
                <ChoiceCard
                  v-for="[y, t, d] in EXPIRY_CHOICES"
                  :key="y"
                  name="expiry"
                  :value="String(y)"
                  :checked="years === y"
                  :title="`${t} · ${expiryLabel(expiryFromYears(y))}`"
                  :description="d || undefined"
                  @change="years = y"
                />
              </div>
            </fieldset>
          </FormRow>

          <FormRow v-if="mode === 'create' && show(3)" label="Spending period" :stepped="stepped" sub>
            <ForenToggle
              v-model="periodOn"
              reverse
              class="w-full justify-between"
              label="Only allow spending between certain dates"
              description="For a trip, an event or a short project. Payments outside the dates are declined."
            />
            <div v-if="periodOn" class="grid grid-cols-2 gap-3">
              <ForenInput v-model="activeFrom" label="From" type="date" />
              <ForenInput v-model="activeUntil" label="Until" type="date" />
            </div>
          </FormRow>

          <FormRow v-if="show(4)" label="Design" hint="Optional" :stepped="stepped">
            <div role="radiogroup" aria-label="Card design" class="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <label v-for="d in designs" :key="d" class="flex cursor-pointer flex-col items-center gap-1.5">
                <input type="radio" name="design" :value="d" :checked="draft.design === d" class="peer sr-only" @change="set({ design: d })" />
                <span
                  :class="
                    cn(
                      'block aspect-[1.586] w-full rounded-[8px] ring-offset-2 ring-offset-surface peer-focus-visible:ring-2 peer-focus-visible:ring-focus',
                      draft.design === d ? 'ring-2 ring-[var(--color-foren-brand-green)]' : 'ring-1 ring-line'
                    )
                  "
                  :style="{ background: `linear-gradient(135deg, ${DESIGNS[d].stops.join(', ')})` }"
                />
                <span :class="cn('text-[12px] font-medium', draft.design === d ? 'text-fg' : 'text-fg-3')">{{ DESIGN_LABEL[d] }}</span>
              </label>
            </div>
            <p v-if="stepped" class="text-[13px] leading-[18px] text-fg-2">Check the summary beside the card. Use Back to change anything before you create it.</p>
          </FormRow>
        </div>

        <!-- Floating action bar (Figma "Floating button"): full content width, pinned to the bottom. -->
        <div class="sticky bottom-0 z-20 border-t border-line bg-surface px-5 py-3 sm:min-h-[84px] sm:px-8 sm:py-5">
          <p v-if="failed" role="alert" class="mb-3 rounded-[14px] bg-error-subtle px-4 py-2.5 text-[13px] leading-[18px] text-error">
            {{ mode === "create" ? "We couldn’t issue this card. Nothing was created, and your answers are still here. Try again." : COPY.saveFailure }}
          </p>
          <div class="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <ForenButton v-if="stepped && step < STEPS.length - 1" type="submit" size="sm" class="w-full sm:order-last sm:flex-1" :disabled="!ready">
              Continue
              <template #trailingIcon><RiArrowRightLine /></template>
            </ForenButton>
            <ForenButton v-else type="submit" size="sm" class="w-full sm:order-last sm:flex-1" :disabled="pending || !ready">
              {{
                mode === "create"
                  ? issuePending
                    ? "Creating card…"
                    : issueError
                      ? "Try again"
                      : COPY.createCard
                  : savePending
                    ? "Saving…"
                    : saveError
                      ? "Try again"
                      : "Save changes"
              }}
            </ForenButton>
            <div class="flex gap-2 sm:contents">
              <ForenButton v-if="stepped && step > 0" type="button" variant="outline" size="sm" class="flex-1" @click="back">
                <template #leadingIcon><RiArrowLeftLine /></template>
                Back
              </ForenButton>
              <LinkButton v-else :href="closeHref" variant="outline" size="sm" class="flex-1">Cancel</LinkButton>
              <ForenButton v-if="stepped" type="button" variant="outline" size="sm" class="flex-1" :disabled="draftPending" @click="saveForLater">
                <template #leadingIcon><RiSave3Line /></template>
                Save and finish later
              </ForenButton>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- Preview + summary pane — doubles as the review before issuing -->
    <aside
      aria-label="Card summary"
      :class="
        cn(
          'mx-5 mt-2 mb-5 flex-1 rounded-[20px] bg-subtle sm:mx-8 lg:sticky lg:top-2 lg:m-2 lg:block lg:h-[calc(100dvh-16px)] lg:w-[44%] lg:max-w-[600px] lg:flex-none lg:overflow-y-auto',
          pane === 'preview' ? 'block' : 'hidden'
        )
      "
    >
      <div class="hidden h-16 items-center justify-end px-6 lg:flex">
        <RouterLink :to="closeHref" aria-label="Close" class="grid size-9 place-items-center rounded-full text-fg-2 outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-focus">
          <RiCloseLine class="size-5" aria-hidden="true" />
        </RouterLink>
      </div>
      <div class="mx-auto flex max-w-[380px] flex-col items-center gap-5 px-6 py-8 lg:py-6">
        <CardArt :card="{ ...draft, nickname: draft.nickname.trim() || 'Card nickname' }" size="lg" :holder-name="nameOnCard(draft) ?? 'Cardholder'" :lock-text="lockText(draft)" />
        <dl class="w-full divide-y divide-line rounded-[20px] bg-surface px-4 text-[13px] ring-1 ring-line">
          <SummaryRow :label="extraNames.length ? `Cards (${extraNames.length + 1})` : 'Nickname'">
            {{ [draft.nickname, ...extraNames].map((n) => n.trim() || "—").join(", ") }}
          </SummaryRow>
          <SummaryRow :label="draft.companyCard ? 'Company card, used by' : 'Cardholder'">
            {{ draft.holderId ? usedBy(draft) : "—" }}
            <span v-if="holder?.invited" class="block text-[12px] text-fg-3">Invite pending</span>
          </SummaryRow>
          <SummaryRow label="Money comes from">
            {{ strategyLabel(draft.funding) }}
            <span class="block text-[12px] text-fg-3">Your Foren balances</span>
          </SummaryRow>
          <SummaryRow label="Where it works">{{ permissionSentence(draft) }}</SummaryRow>
          <SummaryRow label="Spending limit">{{ limitSentence ?? "—" }}</SummaryRow>
          <SummaryRow v-if="periodOn && (draft.activeFrom || draft.activeUntil)" label="Works between">{{ draft.activeFrom ?? "now" }} – {{ draft.activeUntil ?? "no end" }}</SummaryRow>
          <SummaryRow v-if="mode === 'create'" label="Expiration date">{{ expiryLabel(expiry) }}</SummaryRow>
        </dl>
      </div>
    </aside>
  </div>
</template>
