<script setup lang="ts">
import ForenSelect from "@/components/ui/ForenSelect.vue";
import { computed, h, ref } from "vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import ForenSearch from "@/components/ui/ForenSearch.vue";
import type { ForenSearchResult } from "@/components/ui/foren-search";
import MerchantLogo from "@/components/MerchantLogo.vue";
import Modal from "@/components/Modal.vue";
import { useAction } from "@/composables/useAction";
import { POLICY } from "@/config/policy";
import { CATEGORY_LABEL } from "@/domain/labels";
import { parseAmount } from "@/domain/money";
import type { Currency, Merchant } from "@/domain/types";
import { MERCHANTS } from "@/fixtures/merchants";
import { requestEmergencyCard } from "@/services";

const open = defineModel<boolean>("open", { required: true });
const merchant = ref<Merchant | null>(null);
const q = ref("");
const amount = ref("");
const currency = ref<Currency>("USD");
const note = ref("");
const errors = ref<Record<string, string>>({});
const req = useAction(requestEmergencyCard);

const description = `For an urgent payment you can’t make with your usual card. The owner must approve it. It works once, only at one merchant, for ${POLICY.emergencyValidityMinutes} minutes.`;

function search(raw: string): ForenSearchResult[] {
  return raw.trim()
    ? MERCHANTS.filter((m) =>
        m.name.toLowerCase().includes(raw.trim().toLowerCase()),
      )
        .slice(0, 5)
        .map((m) => ({
          value: m.id,
          label: m.name,
          description: CATEGORY_LABEL[m.category],
          icon: h(MerchantLogo, { merchant: m, size: 28 }),
        }))
    : [];
}
function pick(r: ForenSearchResult) {
  const m = MERCHANTS.find((x) => x.id === r.value)!;
  merchant.value = m;
  currency.value = m.billingCurrency;
  q.value = "";
}
const canSend = computed(
  () =>
    !req.pending.value &&
    !!merchant.value &&
    (parseAmount(amount.value, currency.value)?.minor ?? 0) > 0 &&
    !!note.value.trim(),
);

async function send() {
  const e: Record<string, string> = {};
  const amt = parseAmount(amount.value, currency.value);
  if (!merchant.value) e.merchant = "Choose the merchant you need to pay.";
  if (!amt || amt.minor <= 0) e.amount = "Enter an amount above zero.";
  if (!note.value.trim())
    e.note = "Add a reason so the owner can decide quickly.";
  errors.value = e;
  if (Object.keys(e).length) return;
  if (
    (
      await req.run({
        merchantId: merchant.value!.id,
        amount: amt!,
        note: note.value.trim(),
      })
    ).ok
  ) {
    toast("Emergency card requested");
    open.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="Request an emergency card"
    :description="description"
  >
    <div class="space-y-4">
      <div class="flex flex-col gap-2">
        <span class="text-[14px] font-medium text-fg">Merchant</span>
        <div
          v-if="merchant"
          class="flex h-12 items-center gap-2 rounded-[16px] bg-subtle px-3"
        >
          <MerchantLogo :merchant="merchant" :size="26" />
          <span class="flex-1 truncate text-[14px] font-medium">{{
            merchant.name
          }}</span>
          <button
            class="text-[13px] font-semibold text-fg-2 hover:underline"
            @click="merchant = null"
          >
            Change
          </button>
        </div>
        <ForenSearch
          v-else
          v-model="q"
          ariaLabel="Merchant"
          placeholder="Search merchants"
          :on-search="search"
          @select="pick"
        />
        <p v-if="errors.merchant" class="text-[12px] text-error">
          {{ errors.merchant }}
        </p>
      </div>
      <div class="grid grid-cols-[1fr_110px] gap-3">
        <ForenInput
          v-model="amount"
          label="Amount"
          inputmode="decimal"
          :error="errors.amount"
          class="tnum"
        />
        <ForenSelect
          id="em-cur"
          v-model="currency"
          label="Currency"
          :options="
            POLICY.launchCurrencies.map((c) => ({ value: c, label: c }))
          "
        />
      </div>
      <div>
        <label
          for="em-note"
          class="mb-1.5 block text-[14px] font-medium text-fg"
          >Why is it urgent?</label
        >
        <textarea
          id="em-note"
          v-model="note"
          rows="2"
          :aria-invalid="!!errors.note"
          class="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus"
        />
        <p v-if="errors.note" class="mt-1 text-[12px] text-error">
          {{ errors.note }}
        </p>
      </div>
      <p
        v-if="req.error.value"
        role="alert"
        class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error"
      >
        We couldn’t send your request. Try again.
      </p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="outline" size="sm" @click="open = false"
          >Cancel</ForenButton
        >
        <ForenButton size="sm" :disabled="!canSend" @click="send">{{
          req.pending.value ? "Sending…" : "Send request"
        }}</ForenButton>
      </div>
    </div>
  </Modal>
</template>
