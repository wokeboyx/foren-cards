<script setup lang="ts">
import { computed, ref } from "vue";
import { RiForbidLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import FundingLegs from "@/components/FundingLegs.vue";
import MerchantLogo from "@/components/MerchantLogo.vue";
import Money from "@/components/Money.vue";
import SectionTitle from "@/components/SectionTitle.vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { useAction } from "@/composables/useAction";
import { COPY, DECLINE } from "@/content/copy";
import { CATEGORY_LABEL } from "@/domain/labels";
import type { Card, Transaction } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { can } from "@/lib/permissions";
import { blockMerchant } from "@/services";
import { useAppStore } from "@/stores/app";
import ExpenseDetails from "./ExpenseDetails.vue";
import { ownerNext } from "./transactions-page";

const props = defineProps<{ t: Transaction; card: Card }>();
const store = useAppStore();
const m = computed(() => merchantById(props.t.merchantId));
const confirm = ref(false);
const block = useAction(blockMerchant);
const alreadyBlocked = computed(() => props.card.permissions.blockedMerchantIds.includes(props.t.merchantId));
const reason = computed(() => (props.t.declineReason ? DECLINE[props.t.declineReason] : null));
const statusLabel = computed(() => {
  const s = props.t.status;
  return s === "approved" ? "Approved" : s === "declined" ? "Declined" : s === "pending" ? "Pending" : "Refunded";
});

async function onBlock() {
  if ((await block.run(props.card.id, props.t.merchantId)).ok) {
    toast(`${m.value?.name} blocked on ${props.card.nickname}`);
    confirm.value = false;
  }
}
</script>

<template>
  <div class="space-y-6 px-5 py-5 sm:px-6">
    <div class="flex items-center gap-4">
      <MerchantLogo :merchant="m" :size="48" />
      <div class="min-w-0 flex-1">
        <Money :value="t.amount" code class="block text-[26px] leading-[32px] font-semibold tracking-[-0.015em] text-fg" />
        <div class="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-fg-3">
          <ForenBadge size="sm" :color="t.status === 'declined' ? 'error' : t.status === 'approved' ? 'success' : 'gray'">{{ statusLabel }}</ForenBadge>
          {{ m ? CATEGORY_LABEL[m.category] : "" }} · {{ card.nickname }} •• {{ card.last4 }}
        </div>
      </div>
    </div>

    <p v-if="t.viaApprovalId" class="rounded-[14px] bg-info-subtle px-3.5 py-2.5 text-[13px] text-info">Paid using a one-time approval from the account owner.</p>

    <section v-if="reason">
      <SectionTitle class="mb-2">Why it was declined</SectionTitle>
      <div class="rounded-[16px] bg-error-subtle px-4 py-3 text-[14px] leading-[20px]">
        <p class="font-semibold text-error">{{ reason.title }}</p>
        <p class="mt-1 text-fg-2">{{ store.role === "owner" ? ownerNext(t) : reason.next }}</p>
      </div>
    </section>
    <section v-else>
      <SectionTitle class="mb-3">How it was paid</SectionTitle>
      <FundingLegs :legs="t.legs" :fee-avoided="t.feeAvoided" />
    </section>

    <ExpenseDetails v-if="!card.personal && t.status === 'approved'" :t="t" :card="card" />

    <section>
      <SectionTitle class="mb-2">Details</SectionTitle>
      <dl class="divide-y divide-line text-[13px]">
        <div class="grid grid-cols-[110px_1fr] gap-3 py-2">
          <dt class="text-fg-3">Merchant</dt>
          <dd class="tnum text-fg">{{ m?.name }}</dd>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-3 py-2">
          <dt class="text-fg-3">Amount</dt>
          <dd class="tnum text-fg"><Money :value="t.amount" code /></dd>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-3 py-2">
          <dt class="text-fg-3">Date</dt>
          <dd class="tnum text-fg">{{ new Date(t.at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" }) }}</dd>
        </div>
        <div class="grid grid-cols-[110px_1fr] gap-3 py-2">
          <dt class="text-fg-3">Reference</dt>
          <dd class="tnum text-fg">{{ t.id.toUpperCase() }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="can(store.role, 'manageSubscriptions', card) && card.status !== 'canceled'" class="rounded-[16px] border border-line p-4">
      <div class="text-[14px] font-semibold text-fg">Don’t recognise this merchant?</div>
      <p class="mt-1 text-[13px] text-fg-2">Block {{ m?.name }} on this card to decline its future charges. Other merchants aren’t affected.</p>
      <ForenButton variant="outline" size="xs" destructive class="mt-3" :disabled="alreadyBlocked" @click="confirm = true">
        <template #leadingIcon><RiForbidLine /></template>
        {{ alreadyBlocked ? "Blocked on this card" : "Block merchant" }}
      </ForenButton>
    </section>

    <ConfirmDialog
      v-model:open="confirm"
      :title="`Block ${m?.name} on ${card.nickname}?`"
      :consequence="COPY.blockMerchantConfirm"
      confirm-label="Block merchant"
      destructive
      :pending="block.pending.value"
      :error="block.error.value ? COPY.saveFailure : null"
      @confirm="onBlock"
    />
  </div>
</template>
