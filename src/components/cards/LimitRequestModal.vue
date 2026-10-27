<script setup lang="ts">
/** Cardholder asks for a higher limit (Revolut "spending limit increase" request). */
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import Modal from "@/components/Modal.vue";
import { PERIOD_LABEL, PERIOD_PHRASE } from "@/domain/labels";
import { format, parseAmount } from "@/domain/money";
import type { Card } from "@/domain/types";
import { requestLimitIncrease } from "@/services";
import { useAction } from "@/composables/useAction";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const amount = ref(String((props.card.limit.amount.minor / 100) * 2));
const note = ref("");
const send = useAction(requestLimitIncrease);
const parsed = computed(() => parseAmount(amount.value, props.card.limit.amount.currency));
const invalid = computed(() => !parsed.value || parsed.value.minor <= props.card.limit.amount.minor);

async function submit() {
  if ((await send.run(props.card.id, { period: props.card.limit.period, amount: parsed.value! }, note.value.trim() || undefined)).ok) {
    toast("Request sent. We’ll let you know when the account owner decides.");
    emit("close");
  }
}
</script>

<template>
  <Modal
    :open="true"
    title="Ask for a higher limit"
    :description="`${card.nickname} can spend up to ${format(card.limit.amount)} ${PERIOD_PHRASE[card.limit.period]} now.`"
    @update:open="(o) => !o && emit('close')"
  >
    <div class="space-y-4">
      <ForenInput
        v-model="amount"
        :label="`New ${PERIOD_LABEL[card.limit.period].toLowerCase()} limit (${card.limit.amount.currency})`"
        inputmode="decimal"
        class="tnum"
        :error="amount && invalid ? 'Enter an amount higher than the current limit.' : undefined"
      />
      <div class="flex flex-col gap-2">
        <label for="lim-note" class="text-[14px] font-medium text-fg">Why do you need it? <span class="font-normal text-fg-3">(optional)</span></label>
        <textarea
          id="lim-note"
          v-model="note"
          rows="3"
          maxlength="500"
          placeholder="e.g. Conference tickets and hotel next week."
          class="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus"
        />
      </div>
      <p v-if="send.error.value" role="alert" class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t send your request. Try again.</p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="secondary" size="sm" @click="emit('close')">Cancel</ForenButton>
        <ForenButton size="sm" :disabled="invalid || send.pending.value" @click="submit">{{ send.pending.value ? "Sending…" : "Send request" }}</ForenButton>
      </div>
    </div>
  </Modal>
</template>
