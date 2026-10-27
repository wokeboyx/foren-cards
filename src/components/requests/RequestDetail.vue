<script setup lang="ts">
/** Revolut request detail: decision buttons first, then status + approvals, note and request details. */
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { RiCheckLine, RiCloseLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import Modal from "@/components/Modal.vue";
import Money from "@/components/Money.vue";
import TransactionPinDialog from "@/components/TransactionPinDialog.vue";
import { countdown } from "@/components/cards/card-detail";
import { useAction } from "@/composables/useAction";
import { useNow } from "@/composables/useNow";
import { POLICY } from "@/config/policy";
import { DECLINE } from "@/content/copy";
import { PERIOD_PHRASE } from "@/domain/labels";
import { format } from "@/domain/money";
import type { CardRequest } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { decideRequest } from "@/services";
import { personById, requestState, useAppStore } from "@/stores/app";
import ApprovalTimeline from "./ApprovalTimeline.vue";
import RequestIcon from "./RequestIcon.vue";
import RequestDetailRow from "./RequestDetailRow.vue";
import { KIND_LABEL, STATE, requestTitle } from "./requests-page";

const props = defineProps<{ r: CardRequest; canDecide: boolean }>();
const now = useNow(1000);
const store = useAppStore();
const card = computed(() => store.cards.find((c) => c.id === props.r.cardId));
const issued = computed(() => store.cards.find((c) => c.id === props.r.issuedCardId));
const state = computed(() => requestState(props.r, now.value));
const requester = computed(() => personById(props.r.requesterId));
const firstName = computed(() => requester.value?.name.split(" ")[0]);
const m = computed(() => (props.r.merchantId ? merchantById(props.r.merchantId) : undefined));
const decide = useAction(decideRequest);
const denying = ref(false);
const denyNote = ref("");
const pinOpen = ref(false);
const approveLabel = computed(() => {
  const k = props.r.kind;
  return k === "emergency_card" ? "Approve and issue" : k === "unfreeze" ? "Unfreeze" : k === "new_card" ? "Approve and create" : k === "limit_increase" ? "Approve new limit" : "Approve once";
});
// Approving needs the transaction PIN first.
async function approve() {
  const r = props.r;
  if (!(await decide.run(r.id, true)).ok) return false;
  pinOpen.value = false;
  toast(
    r.kind === "one_time_approval"
      ? `Approved for one charge. ${firstName.value} has ${POLICY.approvalWindowMinutes} minutes to retry.`
      : r.kind === "unfreeze"
        ? "Card unfrozen"
        : r.kind === "new_card"
          ? `Card created for ${firstName.value}`
          : r.kind === "limit_increase"
            ? "New limit approved"
            : "Emergency card issued"
  );
  return true;
}
async function deny() {
  if ((await decide.run(props.r.id, false, denyNote.value.trim() || undefined)).ok) {
    denying.value = false;
    toast("Request declined");
  }
}
const when = computed(() => new Date(props.r.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }));
const explainer = computed(() => {
  const r = props.r;
  return r.kind === "one_time_approval"
    ? `Approving lets this exact charge through once within ${POLICY.approvalWindowMinutes} minutes. The card’s permissions and limits don’t change.`
    : r.kind === "emergency_card"
      ? `Issues a single-use card locked to ${m.value?.name}, valid for ${POLICY.emergencyValidityMinutes} minutes${POLICY.emergencyCeiling ? `, up to ${format(POLICY.emergencyCeiling)}` : ""}.`
      : r.kind === "limit_increase"
        ? "The new limit applies to this card straight away. Nothing else about the card changes."
        : r.kind === "new_card"
          ? `Creates the card in ${firstName.value}’s name with these settings. It pays from your balances using Cheapest FX, and you can change anything later.`
          : "Unfreezing lets new charges and subscriptions go through on this card again.";
});
const emergencyStatus = computed(() => {
  const c = issued.value;
  if (!c) return "";
  return c.used ? "used" : new Date(c.validUntil!) > now.value ? `valid for ${countdown(new Date(c.validUntil!).getTime() - now.value.getTime())}` : "expired";
});
</script>

<template>
  <div class="space-y-5 px-5 py-5">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[12px] font-medium text-fg-3">{{ KIND_LABEL[r.kind] }}</p>
        <h2 class="tnum mt-0.5 text-[20px] leading-[26px] font-semibold tracking-[-0.01em] text-fg">{{ requestTitle(r, card) }}</h2>
        <p class="mt-0.5 text-[13px] text-fg-3">{{ when }}</p>
      </div>
      <RequestIcon :r="r" :state="state" :size="40" />
    </div>

    <div v-if="canDecide && state === 'pending'">
      <div class="flex gap-2">
        <ForenButton size="sm" :disabled="decide.pending.value" @click="pinOpen = true">
          <template #leadingIcon><RiCheckLine /></template>
          {{ approveLabel }}
        </ForenButton>
        <ForenButton size="sm" variant="secondary" :disabled="decide.pending.value" @click="denying = true">
          <template #leadingIcon><RiCloseLine /></template>
          Decline
        </ForenButton>
      </div>
      <p class="mt-2 text-[12px] leading-[17px] text-fg-3">{{ explainer }}</p>
      <p v-if="decide.error.value && !denying" role="alert" class="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">
        We couldn’t record your decision. Nothing changed. Try again.
      </p>
    </div>

    <section class="rounded-[16px] bg-sunken p-4">
      <div class="flex items-center justify-between gap-2 text-[13px]">
        <span class="text-fg-2">Status</span>
        <ForenBadge size="sm" :color="STATE[state].color" dot>{{ STATE[state].label }}</ForenBadge>
      </div>
      <ApprovalTimeline :r="r" :state="state" :requester="requester?.name ?? 'Team member'" />
      <p v-if="state === 'approved' && r.kind === 'one_time_approval' && r.windowEndsAt" class="tnum mt-3 text-[13px] text-success">
        Retry window: {{ countdown(new Date(r.windowEndsAt).getTime() - now.getTime()) }} left. Applies to this one charge only.
      </p>
      <p v-if="state === 'approved' && r.kind === 'new_card' && issued" class="mt-3 text-[13px] text-fg-2">
        Created card •• {{ issued.last4 }}.
        <RouterLink :to="`/cards/${issued.id}`" class="font-semibold text-fg underline-offset-2 hover:underline">View card</RouterLink>
      </p>
      <p v-if="state === 'approved' && r.kind === 'emergency_card' && issued" class="mt-3 text-[13px] text-fg-2">
        Issued emergency card •• {{ issued.last4 }} — {{ emergencyStatus }}.
      </p>
    </section>

    <section v-if="r.note" class="rounded-[16px] bg-sunken p-4">
      <div class="text-[12px] font-medium text-fg-3">Note from {{ firstName }}</div>
      <p class="mt-1 text-[14px] leading-[20px] text-fg">{{ r.note }}</p>
    </section>

    <section>
      <h3 class="mb-1 text-[14px] font-semibold text-fg">Request details</h3>
      <dl class="divide-y divide-line text-[13px]">
        <RequestDetailRow label="Requested by">{{ requester?.name }}</RequestDetailRow>
        <RequestDetailRow v-if="card" label="Card">{{ `${card.nickname} •• ${card.last4}` }}</RequestDetailRow>
        <RequestDetailRow v-if="m" label="Merchant">{{ m.name }}</RequestDetailRow>
        <RequestDetailRow v-if="r.amount" label="Amount"><Money :value="r.amount" /></RequestDetailRow>
        <RequestDetailRow v-if="r.reason" label="Declined because">{{ DECLINE[r.reason].title }}</RequestDetailRow>
        <template v-if="r.newLimit">
          <RequestDetailRow label="Current limit">
            <template v-if="r.oldLimit">Up to <Money :value="r.oldLimit.amount" /> {{ PERIOD_PHRASE[r.oldLimit.period] }}</template>
            <template v-else>—</template>
          </RequestDetailRow>
          <RequestDetailRow label="Asked for">Up to <Money :value="r.newLimit.amount" /> {{ PERIOD_PHRASE[r.newLimit.period] }}</RequestDetailRow>
        </template>
        <template v-if="r.newCard">
          <RequestDetailRow label="Card name">{{ r.newCard.nickname }}</RequestDetailRow>
          <RequestDetailRow label="Spending limit">Up to <Money :value="r.newCard.limit.amount" /> {{ PERIOD_PHRASE[r.newCard.limit.period] }}</RequestDetailRow>
          <RequestDetailRow label="Merchants">{{ r.newCard.oneMerchant ? "One merchant (locks to the first that charges it)" : "Many merchants" }}</RequestDetailRow>
        </template>
      </dl>
    </section>

    <TransactionPinDialog v-model:open="pinOpen" :action="approveLabel" :on-confirm="approve" />
    <Modal v-model:open="denying" title="Decline request?" :description="requestTitle(r, card)">
      <label :for="`deny-${r.id}`" class="mb-1.5 block text-[14px] font-medium text-fg">
        Reason <span class="font-normal text-fg-3">(optional)</span>
      </label>
      <textarea
        :id="`deny-${r.id}`"
        v-model="denyNote"
        rows="3"
        maxlength="500"
        placeholder="e.g. Please use the travel card for flights."
        class="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus"
      />
      <div class="tnum mt-1 flex justify-between text-[12px] text-fg-3">
        <span>{{ firstName }} will see this.</span>
        <span>{{ denyNote.length }}/500</span>
      </div>
      <p v-if="decide.error.value" role="alert" class="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t record your decision. Try again.</p>
      <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="secondary" size="sm" @click="denying = false">Cancel</ForenButton>
        <ForenButton size="sm" destructive :disabled="decide.pending.value" @click="deny">Decline request</ForenButton>
      </div>
    </Modal>
  </div>
</template>
