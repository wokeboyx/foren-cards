<script setup lang="ts">
/**
 * Create card as a focus page (Mercury onboarding): one centred column with everything in one go (the card, then its limits),
 * a pill "Create card" button, a live preview beside it, and a confirmation if you try to close it part-way.
 */
import { computed, ref, watchEffect } from "vue";
import { useRouter } from "vue-router";
import CurrencySelect from "@/components/CurrencySelect.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import FocusFrame from "./FocusFrame.vue";
import SendingOverlay from "./SendingOverlay.vue";
import InlineError from "@/components/InlineError.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import TransactionPinDialog from "@/components/TransactionPinDialog.vue";
import { POLICY } from "@/config/policy";
import { useAction } from "@/composables/useAction";
import {
  activeCardCount,
  defaultLimit,
  expiryFrom,
  validateLimits,
} from "@/domain/limits";
import { convert, format, parseAmount } from "@/domain/money";
import type { Card, Currency } from "@/domain/types";
import { issueCards, newCardDraft } from "@/services";
import { now, useAppStore } from "@/stores/app";
import CardArt from "@/components/card/CardArt.vue";
import { nameOnCard } from "@/components/card/holder";
import SkinSelect from "./SkinSelect.vue";
import CardCountMeter from "./CardCountMeter.vue";
import CardCreated from "./CardCreated.vue";
import HolderPicker from "./HolderPicker.vue";
import LimitFields from "./LimitFields.vue";
import CardSummary from "./CardSummary.vue";
import type { CardFormErrors as Errors } from "./card-form";

const props = defineProps<{ prefill?: Partial<Card> }>();

const router = useRouter();
const store = useAppStore();
const card = ref<Card>({ ...newCardDraft(""), ...props.prefill });
const dailyText = ref(String(defaultLimit().daily.minor / 100));
const txnText = ref(String(defaultLimit().txn.minor / 100));
const errors = ref<Errors>({});
const done = ref<Card[] | null>(null);
const pinOpen = ref(false);
const leaving = ref(false);
const issue = useAction(issueCards);

const currency = computed<Currency>(() => card.value.limit.daily.currency);
const expiry = computed(() => expiryFrom(now()));
const dailyAmount = computed(() =>
  parseAmount(dailyText.value, currency.value),
);
const txnAmount = computed(() => parseAmount(txnText.value, currency.value));
const room = computed(
  () => POLICY.maxActiveCards - activeCardCount(store.cards),
);
/** The fee is paid from a balance the customer picks: the fee's own currency by default, or any balance that can cover it. */
const feeFrom = ref<Currency>(POLICY.cardCreationFee.currency);
const feeIn = (c: Currency) => convert(POLICY.cardCreationFee, c);
const feeOptions = computed(() =>
  store.balances
    .filter((b) => b.available.minor >= feeIn(b.currency).minor)
    .map((b) => b.currency),
);
watchEffect(() => {
  if (feeOptions.value.length && !feeOptions.value.includes(feeFrom.value))
    feeFrom.value = feeOptions.value[0];
});
const fee = computed(() => feeIn(feeFrom.value));
const nearCap = computed(
  () => activeCardCount(store.cards) + 1 >= POLICY.maxActiveCards * 0.8,
);
/** Shown as the user types, so "transaction limit above daily limit" doesn't wait for Next. */
const liveLimitErrors = computed(() => {
  const le = validateLimits(dailyAmount.value, txnAmount.value);
  return {
    daily: dailyText.value.trim() ? le.daily : undefined,
    txn: txnText.value.trim() ? le.txn : undefined,
  };
});
const touched = computed(() => !!card.value.nickname.trim());

const set = (patch: Partial<Card>) =>
  (card.value = { ...card.value, ...patch });
const nickname = computed({
  get: () => card.value.nickname,
  set: (nickname: string) => set({ nickname }),
});

function computeErrors(): Errors {
  const d = card.value;
  const e: Errors = {};
  if (!d.nickname.trim())
    e.nickname = "Give the card a name so your team can recognise it.";
  else if (d.nickname.trim().length > 40)
    e.nickname = "Use 40 characters or fewer.";
  if (!d.holderId)
    e.holderId =
      "Choose the team member this card is for, or add someone who isn’t on Foren.";
  if (room.value <= 0)
    e.cap = `You’ve reached the limit of ${POLICY.maxActiveCards} active cards. Terminate one to create another.`;
  const le = validateLimits(dailyAmount.value, txnAmount.value);
  if (le.daily)
    e.daily =
      dailyText.value.trim() && !dailyAmount.value
        ? "Enter an amount using numbers only, like 2,500.00."
        : le.daily;
  if (le.txn)
    e.txn =
      txnText.value.trim() && !txnAmount.value
        ? "Enter an amount using numbers only, like 2,500.00."
        : le.txn;
  return e;
}

// The primary action stays disabled until everything is filled in.
const ready = computed(() => Object.keys(computeErrors()).length === 0);

function next() {
  const e = computeErrors();
  errors.value = e;
  if (Object.keys(e).length) {
    document
      .querySelector('[aria-invalid="true"]')
      ?.scrollIntoView({ block: "center" });
    return;
  }
  issue.clearError();
  pinOpen.value = true;
}

/** Creating cards needs the transaction PIN first; the PIN dialog runs this once it's accepted. */
async function create(): Promise<boolean> {
  const v: Card = {
    ...card.value,
    nickname: card.value.nickname.trim(),
    limit: { daily: dailyAmount.value!, txn: txnAmount.value! },
    expiry: expiry.value,
  };
  if (!(await issue.run([v], feeFrom.value)).ok) return false;
  pinOpen.value = false;
  done.value = [v];
  return true;
}

function another() {
  card.value = { ...newCardDraft(""), ...props.prefill };
  dailyText.value = String(defaultLimit().daily.minor / 100);
  txnText.value = String(defaultLimit().txn.minor / 100);
  errors.value = {};
  done.value = null;
}

/** Closing part-way asks first; an untouched form just closes. */
function close() {
  if (touched.value) leaving.value = true;
  else router.push("/cards");
}

/** Rule errors from the server (card cap, fee) are shown as-is; anything else gets the generic message. */
const issueFailure = computed(() =>
  issue.error.value && issue.error.value !== "Simulated failure"
    ? issue.error.value
    : "We couldn’t issue this card. Nothing was created, and your answers are still here. Try again.",
);
</script>

<template>
  <CardCreated
    v-if="done"
    :cards="done"
    :fee-from="feeFrom"
    @another="another"
  />

  <FocusFrame v-else aside @close="close">
    <SendingOverlay
      v-if="issue.pending.value"
      :title="`Creating ${card.nickname.trim() || 'your card'}`"
      description="Your card is being created and the fee charged. This usually takes a few seconds. Please do not close or refresh this page."
    />
    <div class="flex flex-1 flex-col lg:pr-[calc(min(42vw,560px)+48px)]">
      <form
        id="create-card-form"
        novalidate
        class="mx-auto w-full max-w-[640px] flex-1 px-5 pt-12 pb-16 sm:px-8 sm:pt-16"
        @submit.prevent="next"
      >
        <h1
          class="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] [font-synthesis:none] text-fg"
        >
          Create a card
        </h1>
        <p
          v-if="Object.keys(errors).length > 0"
          role="alert"
          class="mt-5 rounded-[14px] bg-error-subtle px-4 py-2.5 text-[13px] font-medium text-error"
        >
          Check the highlighted fields.
        </p>

        <!-- 1. Who it's for -->
        <div class="mt-8">
          <HolderPicker :card="card" :error="errors.holderId" @change="set" />
        </div>

        <!-- 2. How much it can spend -->
        <div class="mt-10 space-y-6 border-t border-line pt-10">
          <div>
            <h2
              class="text-[22px] leading-[30px] font-semibold tracking-[-0.01em] text-fg"
            >
              How much can it spend?
            </h2>
            <p class="mt-2 text-[14px] leading-[21px] text-fg-2">
              Set a daily limit and a limit for each transaction.
            </p>
          </div>
          <LimitFields
            v-model:daily="dailyText"
            v-model:txn="txnText"
            :currency="currency"
            :errors="{
              daily: errors.daily ?? liveLimitErrors.daily,
              txn: errors.txn ?? liveLimitErrors.txn,
            }"
          />
        </div>

        <!-- 3. Last: customise it (name and colour) -->
        <div class="mt-10 space-y-6 border-t border-line pt-10">
          <div>
            <h2
              class="text-[22px] leading-[30px] font-semibold tracking-[-0.01em] text-fg"
            >
              Customise your card
            </h2>
            <p class="mt-2 text-[14px] leading-[21px] text-fg-2">
              Name it so your team recognises it, and pick a colour.
            </p>
          </div>
          <div class="rounded-[20px] bg-surface py-8 lg:hidden">
            <CardArt
              :card="card"
              size="md"
              class="mx-auto"
              :holder-name="nameOnCard(card)"
            />
          </div>
          <!-- A card's name and colour share a row -->
          <div class="space-y-4">
            <div class="flex items-start gap-2">
              <ForenInput
                v-model="nickname"
                container-class-name="flex-1"
                label="Nickname"
                placeholder="e.g. Ops travel"
                maxlength="60"
                :error="errors.nickname"
              />
              <SkinSelect
                :model-value="card.design"
                label="Colour"
                accessible-name="Card colour"
                @update:model-value="(design) => set({ design })"
              />
            </div>
          </div>
          <CardCountMeter
            v-if="nearCap"
            :used="activeCardCount(store.cards)"
            :max="POLICY.maxActiveCards"
            :adding="1"
          />
          <InlineError v-if="errors.cap">{{ errors.cap }}</InlineError>
          <!-- Who pays the creation fee -->
          <div>
            <CurrencySelect
              v-model="feeFrom"
              label="Pay the creation fee from"
              :options="feeOptions"
              :balances="store.balances"
            />
            <InlineError v-if="feeOptions.length === 0" class="mt-2">
              None of your balances can cover the
              {{ format(POLICY.cardCreationFee) }} fee. Add money to one of them
              first.
            </InlineError>
            <p v-else class="mt-2 text-[13px] leading-[18px] text-fg-2">
              {{ format(fee) }} once, when you create the card<template
                v-if="feeFrom !== POLICY.cardCreationFee.currency"
              >
                ({{ format(POLICY.cardCreationFee) }} converted)</template
              >. You’ll confirm with your transaction PIN.
            </p>
          </div>
        </div>

        <InlineError v-if="issue.error.value && !pinOpen" class="mt-6">{{
          issueFailure
        }}</InlineError>
      </form>

      <!-- Live preview beside the form: the card, and what's about to be created -->
      <aside
        aria-label="Card summary"
        tabindex="0"
        class="hidden lg:fixed lg:top-[88px] lg:right-6 lg:bottom-[88px] lg:z-10 lg:block lg:w-[42vw] lg:max-w-[560px] lg:overflow-y-auto lg:rounded-[20px] lg:bg-surface lg:shadow-[0px_1px_2px_0px_rgba(36,28,21,0.05)]"
      >
        <div
          class="mx-auto flex max-w-[380px] flex-col items-center gap-5 px-6 py-10"
        >
          <CardArt
            :card="{ ...card, nickname: card.nickname.trim() || 'Card name' }"
            size="lg"
            :holder-name="nameOnCard(card)"
          />
          <CardSummary
            :card="card"
            :daily="dailyAmount"
            :txn="txnAmount"
            :fee="fee"
            :from="feeFrom"
            :original="
              feeFrom !== POLICY.cardCreationFee.currency
                ? POLICY.cardCreationFee
                : undefined
            "
          />
        </div>
      </aside>
    </div>

    <template #footer>
      <ForenButton
        type="button"
        variant="outline"
        size="xxs"
        class="min-w-[110px]"
        @click="close"
        >Cancel</ForenButton
      >
      <ForenButton
        type="submit"
        form="create-card-form"
        size="xs"
        class="min-w-[130px]"
        :disabled="issue.pending.value || !ready || feeOptions.length === 0"
      >
        {{
          issue.pending.value
            ? "Creating card…"
            : issue.error.value
              ? "Try again"
              : "Create card"
        }}
      </ForenButton>
    </template>

    <ConfirmDialog
      v-model:open="leaving"
      title="Leave without creating the card?"
      confirm-label="Leave"
      cancel-label="Keep editing"
      destructive
      @confirm="router.push('/cards')"
    >
      <template #consequence
        >Nothing has been created or charged. What you’ve entered here will be
        lost.</template
      >
    </ConfirmDialog>

    <TransactionPinDialog
      v-model:open="pinOpen"
      :action="`Create card · ${format(fee)}`"
      busy-label="Creating card…"
      :description="`Confirm with your PIN to create this card. ${format(fee)} will be charged.`"
      :failure-text="issueFailure"
      :on-confirm="create"
    />
  </FocusFrame>
</template>
