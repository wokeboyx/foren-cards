<script setup lang="ts">
/** Top a card up from one of your multi-currency balances as a full page (Mercury "Transfer funds"): amount and balance, then a review. Cards only spend what's on them. */
import { computed, ref } from "vue";
import { RiArrowLeftLine, RiArrowUpDownLine } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import CurrencyFlag from "@/components/CurrencyFlag.vue";
import FocusFrame from "@/components/create/FocusFrame.vue";
import SendingOverlay from "@/components/create/SendingOverlay.vue";
import InlineError from "@/components/InlineError.vue";
import FundFields from "@/components/create/FundFields.vue";
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import { useRouter } from "vue-router";
import TransactionPinDialog from "@/components/TransactionPinDialog.vue";
import { POLICY } from "@/config/policy";
import { feeScheduleText } from "@/domain/fees";
import { useAction } from "@/composables/useAction";
import { format, formatApproxRate, parseAmount } from "@/domain/money";
import { fundingCost } from "@/domain/routing";
import type { Card, Currency } from "@/domain/types";
import { fundCard } from "@/services";
import { useAppStore } from "@/stores/app";
import TransactionStatusView from "./TransactionStatusView.vue";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const store = useAppStore();
const cur = props.card.balance.currency;
const balances = computed(() =>
  props.card.personal ? store.personalBalances : store.balances,
);
// Start from the card's own currency when you hold it: no conversion fee.
const from = ref<Currency>(
  balances.value.find((b) => b.currency === cur)?.currency ??
    balances.value[0]?.currency ??
    cur,
);
const amount = ref("");
const touched = ref(false);
const reviewing = ref(false);
/** Set once the money is on the card: the page becomes the status page. */
const doneAt = ref<string | null>(null);
const fund = useAction(fundCard);
const feeNote = feeScheduleText(POLICY.cardFundingFee, format);
const pinOpen = ref(false);
const router = useRouter();
function viewCard() {
  emit("close");
  router.push(`/cards/${props.card.id}`);
}

const parsed = computed(() => parseAmount(amount.value, cur));
const cost = computed(() =>
  parsed.value && parsed.value.minor > 0
    ? fundingCost(parsed.value, from.value)
    : null,
);
const amountError = computed(() => {
  if (!touched.value && !amount.value) return undefined;
  if (!parsed.value || parsed.value.minor <= 0)
    return "Enter an amount above zero, using numbers only.";
  const have =
    balances.value.find((b) => b.currency === from.value)?.available.minor ?? 0;
  if (fundingCost(parsed.value, from.value).debit.minor > have)
    return `Your ${from.value} balance can’t cover this. Add less or pick another balance.`;
  return undefined;
});
const invalid = computed(
  () => !parsed.value || parsed.value.minor <= 0 || !!amountError.value,
);

function next() {
  touched.value = true;
  if (!invalid.value) reviewing.value = true;
}

/** The PIN was accepted: put the money on the card. */
async function confirmFund(): Promise<boolean> {
  if (invalid.value) return false;
  if (!(await fund.run(props.card.id, from.value, parsed.value!)).ok)
    return false;
  pinOpen.value = false;
  doneAt.value = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return true;
}
</script>

<template>
  <DialogRoot :open="true" @update:open="(o) => !o && emit('close')">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-[60] bg-surface" />
      <DialogContent
        class="fixed inset-0 z-[70] overflow-hidden bg-surface outline-none"
        @open-auto-focus.prevent
      >
        <SendingOverlay
          v-if="fund.pending.value && parsed"
          :title="`Adding ${format(parsed)} to ${card.nickname}`"
          description="Your top-up is being processed. This usually takes a few seconds. Please do not close or refresh this page."
        />
        <FocusFrame
          :center="!!(doneAt && parsed && cost)"
          :width="550"
          @close="emit('close')"
        >
          <TransactionStatusView
            v-if="doneAt && parsed && cost"
            title="Card funded"
            :subtitle="`${format(parsed)} added to ${card.nickname}`"
            :steps="[
              {
                label: `${format(cost.debit)} taken from your ${from} balance`,
                time: doneAt,
                done: true,
              },
              { label: 'Added to the card balance', done: true },
            ]"
            :buttons="[
              { label: 'View card', onClick: viewCard },
              { label: 'Got it', primary: true, onClick: () => emit('close') },
            ]"
          />

          <template v-else>
            <div
              class="mx-auto w-full max-w-[550px] flex-1 px-5 pt-8 pb-16 sm:pt-12"
            >
              <button
                v-if="reviewing"
                type="button"
                aria-label="Back"
                :disabled="fund.pending.value"
                class="mb-6 grid size-10 place-items-center rounded-full bg-surface text-fg shadow-[var(--shadow-foren-xs)] ring-1 ring-line outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-focus"
                @click="reviewing = false"
              >
                <RiArrowLeftLine class="size-5" aria-hidden="true" />
              </button>
              <DialogTitle
                class="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] [font-synthesis:none] text-fg"
                >Fund this card</DialogTitle
              >
              <DialogDescription
                class="mt-2 text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg-2"
              >
                {{
                  reviewing
                    ? "Review the details, then confirm."
                    : `${card.nickname} · ${format(card.balance)} now`
                }}
              </DialogDescription>

              <form
                v-if="!reviewing"
                id="fund-card-form"
                class="mt-8"
                novalidate
                @submit.prevent="next"
              >
                <h2 class="mb-5 text-[16px] font-medium text-fg">
                  One-time top-up
                </h2>
                <FundFields
                  v-model:from="from"
                  v-model:amount="amount"
                  :currency="cur"
                  :balances="balances"
                  :amount-error="amountError"
                />
              </form>

              <div v-else-if="parsed && cost" class="mt-8 space-y-6">
                <div>
                  <div
                    class="tnum text-[40px] leading-[48px] font-semibold tracking-[-0.02em] text-fg"
                  >
                    {{ format(parsed) }}
                  </div>
                  <p class="text-[13px] text-fg-3">
                    Goes onto the card straight away.
                  </p>
                </div>
                <!-- Figma swap review: what leaves, what arrives, then the rate, fee and timing -->
                <section
                  class="rounded-[20px] bg-surface p-5"
                  aria-label="Funding summary"
                >
                  <p
                    class="text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg-2"
                  >
                    You’re funding {{ card.nickname }} •• {{ card.last4 }}
                  </p>
                  <div class="mt-3 flex items-center gap-3">
                    <CurrencyFlag :currency="from" :size="32" />
                    <div>
                      <div
                        class="tnum text-[18px] leading-[26px] font-semibold text-fg"
                      >
                        {{ format(cost.debit) }}
                      </div>
                      <div class="text-[12px] leading-[18px] text-fg-3">
                        From {{ from }} balance
                      </div>
                    </div>
                  </div>
                  <RiArrowUpDownLine
                    class="my-3 ml-1 size-5 text-fg-2"
                    aria-hidden="true"
                  />
                  <div class="flex items-center gap-3">
                    <CurrencyFlag :currency="cur" :size="32" />
                    <div>
                      <div
                        class="tnum text-[18px] leading-[26px] font-semibold text-fg"
                      >
                        {{ format(parsed) }}
                      </div>
                      <div class="text-[12px] leading-[18px] text-fg-3">
                        {{ card.nickname }} balance
                      </div>
                    </div>
                  </div>
                </section>
                <dl
                  class="space-y-1 rounded-[20px] bg-surface p-3 text-[14px] leading-[21px] font-medium tracking-[0.14px]"
                  aria-label="Rate and fees"
                >
                  <div
                    v-if="cost.fx"
                    class="flex items-center justify-between gap-4 py-1.5"
                  >
                    <dt class="text-fg-2">Exchange rate</dt>
                    <dd class="tnum text-fg" data-testid="exchange-rate">
                      {{ formatApproxRate(cur, from) }}
                    </dd>
                  </div>
                  <div class="flex items-center justify-between gap-4 py-1.5">
                    <dt class="text-fg-2">
                      Funding fee
                      <span
                        class="block text-[12px] leading-[18px] text-fg-3"
                        >{{ feeNote }}</span
                      >
                    </dt>
                    <dd class="tnum text-fg" data-testid="funding-fee">
                      {{ format(cost.cardFee) }}
                    </dd>
                  </div>
                  <div
                    v-if="cost.fx"
                    class="flex items-center justify-between gap-4 py-1.5"
                  >
                    <dt class="text-fg-2">Conversion fee</dt>
                    <dd class="tnum text-fg">{{ format(cost.fee) }}</dd>
                  </div>
                  <div class="flex items-center justify-between gap-4 py-1.5">
                    <dt class="text-fg-2">Arrives</dt>
                    <dd class="text-fg">Instantly</dd>
                  </div>
                </dl>
                <InlineError v-if="fund.error.value">{{
                  fund.error.value
                }}</InlineError>
                <p class="text-[12px] leading-[17px] text-fg-3">
                  By confirming, you authorise Foren to take
                  {{ format(cost.debit) }} from your {{ from }} balance.
                </p>
              </div>
            </div>
          </template>
          <template v-if="!(doneAt && parsed && cost)" #footer>
            <ForenButton
              type="button"
              variant="outline"
              size="xxs"
              class="min-w-[110px]"
              :disabled="fund.pending.value"
              @click="emit('close')"
              >Cancel</ForenButton
            >
            <ForenButton
              v-if="!reviewing"
              type="submit"
              form="fund-card-form"
              size="xs"
              class="min-w-[130px]"
              :disabled="touched && invalid"
            >
              Next
            </ForenButton>
            <ForenButton
              v-else
              type="button"
              size="xs"
              class="min-w-[130px]"
              :disabled="fund.pending.value"
              @click="pinOpen = true"
              >{{ fund.pending.value ? "Adding…" : "Add money" }}</ForenButton
            >
          </template>
        </FocusFrame>
        <TransactionPinDialog
          v-model:open="pinOpen"
          :action="parsed ? `Add ${format(parsed)}` : 'Add money'"
          busy-label="Adding…"
          description="Enter your 6-digit transaction PIN to put this money on the card."
          :failure-text="
            fund.error.value ??
            'We couldn’t add the money. Nothing was taken. Try again.'
          "
          :on-confirm="confirmFund"
        />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
