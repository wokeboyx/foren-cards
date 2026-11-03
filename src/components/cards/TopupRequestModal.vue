<script setup lang="ts">
/**
 * A cardholder asks the account owner to add money to their card. A full page like the other money flows
 * (Figma "Request money"): amount and why, then the "Request sent" status page with a reference.
 */
import { computed, ref } from "vue";
import {
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
import CurrencyFlag from "@/components/CurrencyFlag.vue";
import FocusFrame from "@/components/create/FocusFrame.vue";
import SendingOverlay from "@/components/create/SendingOverlay.vue";
import InlineError from "@/components/InlineError.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import { useRouter } from "vue-router";
import { useAction } from "@/composables/useAction";
import { format, parseAmount } from "@/domain/money";
import type { Card, CardRequest } from "@/domain/types";
import { PEOPLE } from "@/fixtures/seed";
import { requestTopup } from "@/services";
import TransactionStatusView from "./TransactionStatusView.vue";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const cur = props.card.balance.currency;
const owner = PEOPLE.find((p) => p.role === "owner");
const ownerFirst = owner?.name.split(" ")[0] ?? "the account owner";
const amount = ref("");
const note = ref("");
const touched = ref(false);
const sent = ref<CardRequest | null>(null);
const send = useAction(requestTopup);
const router = useRouter();
function viewCard() {
  emit("close");
  router.push(`/cards/${props.card.id}`);
}

const parsed = computed(() => parseAmount(amount.value, cur));
const amountError = computed(() =>
  touched.value && (!parsed.value || parsed.value.minor <= 0)
    ? "Enter an amount above zero, using numbers only."
    : undefined,
);
const QUICK = [100, 500, 1000, 5000];

async function submit() {
  touched.value = true;
  if (!parsed.value || parsed.value.minor <= 0) return;
  const r = await send.run(
    props.card.id,
    parsed.value,
    note.value.trim() || undefined,
  );
  if (r.ok) sent.value = r.value;
}

const when = (iso: string) =>
  new Date(iso)
    .toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "")
    .replace(/(\d{4}) /, "$1 · ");
const reference = (r: CardRequest) =>
  `TXN-${r.id.replace(/\D/g, "").slice(-4).padStart(4, "0")}`;
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
          v-if="send.pending.value"
          :title="`Sending your request to ${ownerFirst}`"
          description="Your top-up request is being sent. This usually takes a few seconds. Please do not close or refresh this page."
        />
        <FocusFrame :center="!!sent" :width="550" @close="emit('close')">
          <TransactionStatusView
            v-if="sent"
            title="Request sent"
            :subtitle="`${format(sent.amount!)} requested for ${card.nickname}`"
            :steps="[
              { label: 'Request sent', time: when(sent.createdAt), done: true },
              { label: `Waiting for ${ownerFirst} to approve`, done: false },
            ]"
            :reference="reference(sent)"
            :buttons="[
              { label: 'View card', onClick: viewCard },
              { label: 'Got it', primary: true, onClick: () => emit('close') },
            ]"
          />

          <template v-else>
            <form
              id="topup-request-form"
              novalidate
              class="mx-auto w-full max-w-[550px] flex-1 px-5 pt-12 pb-16 sm:pt-14"
              @submit.prevent="submit"
            >
              <DialogTitle
                class="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] [font-synthesis:none] text-fg"
                >Request a top-up</DialogTitle
              >
              <DialogDescription
                class="mt-2 text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg-2"
              >
                {{ card.nickname }} · {{ format(card.balance) }} now.
                {{ ownerFirst }}
                adds the money if they approve.
              </DialogDescription>

              <div class="mt-8 space-y-5">
                <ForenInput
                  v-model="amount"
                  :label="`Amount (${cur})`"
                  placeholder="0.00"
                  inputmode="decimal"
                  class="tnum"
                  :error="amountError"
                >
                  <template #leadingIcon>
                    <span
                      class="flex items-center gap-1.5 text-[14px] font-medium text-fg-2"
                      ><CurrencyFlag :currency="cur" :size="18" />{{
                        cur
                      }}</span
                    >
                  </template>
                </ForenInput>
                <div
                  class="flex flex-wrap gap-2"
                  role="group"
                  aria-label="Suggested amounts"
                >
                  <button
                    v-for="n in QUICK"
                    :key="n"
                    type="button"
                    class="tnum h-8 rounded-full bg-subtle px-3.5 text-[13px] font-medium text-fg outline-none hover:bg-line focus-visible:ring-2 focus-visible:ring-focus"
                    @click="amount = String(n)"
                  >
                    {{ format({ minor: n * 100, currency: cur }) }}
                  </button>
                </div>
                <div class="flex flex-col gap-2">
                  <label
                    for="topup-note"
                    class="text-[14px] font-medium text-fg"
                    >Why do you need it?
                    <span class="font-normal text-fg-3">(optional)</span></label
                  >
                  <textarea
                    id="topup-note"
                    v-model="note"
                    rows="3"
                    maxlength="500"
                    placeholder="e.g. Hotel and flights for next week."
                    class="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus"
                  />
                </div>
                <InlineError v-if="send.error.value"
                  >We couldn’t send your request. Nothing was sent. Try
                  again.</InlineError
                >
              </div>
            </form>
          </template>
          <template v-if="!sent" #footer>
            <ForenButton
              type="button"
              variant="outline"
              size="xxs"
              class="min-w-[110px]"
              @click="emit('close')"
              >Cancel</ForenButton
            >
            <ForenButton
              type="submit"
              form="topup-request-form"
              size="xs"
              class="min-w-[130px]"
              :disabled="send.pending.value"
            >
              {{ send.pending.value ? "Sending…" : "Send request" }}
            </ForenButton>
          </template>
        </FocusFrame>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
