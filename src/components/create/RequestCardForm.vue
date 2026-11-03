<script setup lang="ts">
/**
 * A team member asks for a card. It is the same page as Create a card: one form on the left (name and colour, why,
 * limits) and a live preview on the right that fills in as they type. Sending it adds a "Pending request" row to their
 * card list. The owner pays the creation fee when they approve.
 */
import FocusFrame from "./FocusFrame.vue";
import SendingOverlay from "./SendingOverlay.vue";
import InlineError from "@/components/InlineError.vue";
import TransactionStatusView from "@/components/cards/TransactionStatusView.vue";
import { computed, ref } from "vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import CardArt from "@/components/card/CardArt.vue";
import LinkButton from "@/components/LinkButton.vue";
import CurrencyFlag from "@/components/CurrencyFlag.vue";
import { POLICY } from "@/config/policy";
import { defaultLimit, validateLimits } from "@/domain/limits";
import { format, parseAmount } from "@/domain/money";
import type { CardDesign, CardRequest, Currency } from "@/domain/types";
import { PEOPLE } from "@/fixtures/seed";
import { can } from "@/lib/permissions";
import { useAction } from "@/composables/useAction";
import { requestNewCard } from "@/services";
import { currentUserId, personById, useAppStore } from "@/stores/app";
import LimitFields from "./LimitFields.vue";
import NotAllowed from "./NotAllowed.vue";
import SkinSelect from "./SkinSelect.vue";
import SummaryRow from "./SummaryRow.vue";

const store = useAppStore();
const me = computed(() => personById(currentUserId(store.role)));
const owner = PEOPLE.find((p) => p.role === "owner");
const ownerFirst = owner?.name.split(" ")[0] ?? "the account owner";
const nickname = ref("");
const design = ref<CardDesign>("ink");
const note = ref("");
/** Limits are set in US dollars. */
const currency: Currency = "USD";
const dailyText = ref(String(defaultLimit().daily.minor / 100));
const txnText = ref(String(defaultLimit().txn.minor / 100));
const errors = ref<{ nickname?: string; daily?: string; txn?: string }>({});
const sent = ref<CardRequest | null>(null);
const send = useAction(requestNewCard);
const { pending, error } = send;
const dailyAmount = computed(() => parseAmount(dailyText.value, currency));
const txnAmount = computed(() => parseAmount(txnText.value, currency));
const limitErrors = computed(() =>
  validateLimits(dailyAmount.value, txnAmount.value),
);
const notAllowed = computed(
  () => can(store.role, "issue") || store.role === "individual",
);
const trimmed = computed(() => nickname.value.trim());
const nicknameError = computed(() =>
  !trimmed.value
    ? "Give the card a name, like “Team travel”."
    : trimmed.value.length > 40
      ? "Use 40 characters or fewer."
      : undefined,
);
const ready = computed(
  () =>
    !nicknameError.value && !limitErrors.value.daily && !limitErrors.value.txn,
);
const show = (m: ReturnType<typeof parseAmount>) => (m ? format(m) : "—");

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

const preview = computed(() => ({
  design: design.value,
  nickname: trimmed.value || "Card name",
  last4: "",
  kind: "standard" as const,
  status: "active" as const,
}));

async function submit() {
  errors.value = {
    nickname: nicknameError.value,
    ...limitErrors.value,
  };
  if (!ready.value) return;
  const r = await send.run({
    nickname: trimmed.value,
    note: note.value.trim() || undefined,
    oneMerchant: false,
    design: design.value,
    limit: { daily: dailyAmount.value!, txn: txnAmount.value! },
  });
  if (r.ok) sent.value = r.value;
}
</script>

<template>
  <div v-if="notAllowed" class="mx-auto max-w-[640px] p-6">
    <NotAllowed
      body="Account owners create cards directly. Use Create card instead."
    />
  </div>

  <!-- Sent: the same status page as the other money flows -->
  <FocusFrame v-else-if="sent" center @close="$router.push('/cards')">
    <TransactionStatusView
      title="Request sent"
      :subtitle="`${trimmed} · ${ownerFirst} will review it`"
      :steps="[
        { label: 'Request sent', time: when(sent.createdAt), done: true },
        { label: `Waiting for ${ownerFirst} to approve`, done: false },
      ]"
      :reference="reference(sent)"
      :buttons="[
        {
          label: 'View request',
          onClick: () => $router.push(`/cards?request=${sent!.id}`),
        },
        {
          label: 'Got it',
          primary: true,
          onClick: () => $router.push('/cards'),
        },
      ]"
    />
  </FocusFrame>

  <FocusFrame v-else aside @close="$router.push('/cards')">
    <SendingOverlay
      v-if="pending"
      :title="`Sending your request to ${ownerFirst}`"
      description="Your card request is being sent. This usually takes a few seconds. Please do not close or refresh this page."
    />
    <div class="flex flex-1 flex-col lg:pr-[calc(min(42vw,560px)+48px)]">
      <form
        id="request-card-form"
        novalidate
        class="mx-auto w-full max-w-[640px] flex-1 px-5 pt-12 pb-16 sm:px-8 sm:pt-16"
        @submit.prevent="submit"
      >
        <h1
          class="font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] [font-synthesis:none] text-fg"
        >
          Request a card
        </h1>
        <p
          v-if="Object.values(errors).some(Boolean)"
          role="alert"
          class="mt-5 rounded-[14px] bg-error-subtle px-4 py-2.5 text-[13px] font-medium text-error"
        >
          Check the highlighted fields.
        </p>

        <!-- 1. Name and colour, and why -->
        <div class="mt-8 space-y-6">
          <div class="rounded-[20px] bg-surface py-8 lg:hidden">
            <CardArt
              :card="preview"
              size="md"
              class="mx-auto"
              :holder-name="me?.name"
            />
          </div>
          <div class="flex items-start gap-2">
            <ForenInput
              v-model="nickname"
              container-class-name="flex-1"
              label="Nickname"
              placeholder="e.g. Team travel"
              maxlength="60"
              :error="errors.nickname"
            />
            <SkinSelect
              v-model="design"
              label="Colour"
              accessible-name="Card colour"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="req-note" class="text-[14px] font-medium text-fg"
              >Why do you need it?
              <span class="font-normal text-fg-3">(optional)</span></label
            >
            <textarea
              id="req-note"
              v-model="note"
              rows="3"
              maxlength="500"
              placeholder="e.g. Flights and hotels for the Abuja client visit."
              class="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus"
            />
            <span class="tnum text-right text-[12px] text-fg-3"
              >{{ note.length }}/500</span
            >
          </div>
        </div>

        <!-- 2. Limits -->
        <div class="mt-10 space-y-4 border-t border-line pt-10">
          <div>
            <h2
              class="text-[22px] leading-[30px] font-semibold tracking-[-0.01em] text-fg"
            >
              How much will you spend?
            </h2>
            <p class="mt-2 text-[14px] leading-[21px] text-fg-2">
              Ask for the limit you expect to need. The account owner decides
              the final amount.
            </p>
          </div>
          <p class="flex items-center gap-2 text-[13px] text-fg-2">
            <CurrencyFlag :currency="currency" :size="18" /> Limits are set in
            {{ currency }} only.
          </p>
          <LimitFields
            v-model:daily="dailyText"
            v-model:txn="txnText"
            :currency="currency"
            :errors="errors"
          />
        </div>

        <InlineError v-if="error" class="mt-6"
          >We couldn’t send your request. Nothing was sent. Try
          again.</InlineError
        >
      </form>

      <!-- Live preview beside the form: the card, and what's being asked for -->
      <aside
        aria-label="Request summary"
        tabindex="0"
        class="hidden lg:fixed lg:top-[88px] lg:right-6 lg:bottom-[88px] lg:z-10 lg:block lg:w-[42vw] lg:max-w-[560px] lg:overflow-y-auto lg:rounded-[20px] lg:bg-surface lg:shadow-[0px_1px_2px_0px_rgba(36,28,21,0.05)]"
      >
        <div
          class="mx-auto flex max-w-[380px] flex-col items-center gap-5 px-6 py-10"
        >
          <CardArt :card="preview" size="lg" :holder-name="me?.name" />
          <dl
            class="w-full divide-y divide-line rounded-[20px] bg-surface px-4 text-[13px] ring-1 ring-line"
            aria-label="Request details so far"
          >
            <SummaryRow label="Name">
              <span :class="!trimmed && 'text-fg-3'">{{
                trimmed || "Not named yet"
              }}</span>
            </SummaryRow>
            <SummaryRow label="For">{{ me?.name }}</SummaryRow>
            <SummaryRow label="Daily limit">{{ show(dailyAmount) }}</SummaryRow>
            <SummaryRow label="Per transaction">{{
              show(txnAmount)
            }}</SummaryRow>
            <SummaryRow label="Goes to"
              >{{ owner?.name }} (account owner)</SummaryRow
            >
            <div class="grid grid-cols-[1fr_auto] items-start gap-x-4 py-2.5">
              <dt class="text-fg-3">Creation fee</dt>
              <dd class="tnum text-right text-fg">
                {{ format(POLICY.cardCreationFee) }}
              </dd>
              <dd class="col-span-2 mt-1 text-left text-[12px] text-fg-3">
                Paid by {{ owner?.name.split(" ")[0] }} when they approve.
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>

    <template #footer>
      <LinkButton
        href="/cards"
        variant="outline"
        size="xxs"
        class="min-w-[110px]"
        >Cancel</LinkButton
      >
      <ForenButton
        type="submit"
        form="request-card-form"
        size="xs"
        class="min-w-[130px]"
        :disabled="pending || !ready"
      >
        {{ pending ? "Sending…" : error ? "Try again" : "Send request" }}
      </ForenButton>
    </template>
  </FocusFrame>
</template>
