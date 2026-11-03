<script setup lang="ts">
/** Cardholder asks for a higher limit (Revolut "spending limit increase" request). */
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import Modal from "@/components/Modal.vue";
import LimitFields from "@/components/create/LimitFields.vue";
import { limitSummary, validateLimits } from "@/domain/limits";
import { parseAmount } from "@/domain/money";
import type { Card } from "@/domain/types";
import { requestLimitIncrease } from "@/services";
import { useAction } from "@/composables/useAction";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const cur = props.card.limit.daily.currency;
const daily = ref(String((props.card.limit.daily.minor / 100) * 2));
const txn = ref(String(props.card.limit.txn.minor / 100));
const note = ref("");
const send = useAction(requestLimitIncrease);
const parsedDaily = computed(() => parseAmount(daily.value, cur));
const parsedTxn = computed(() => parseAmount(txn.value, cur));
const errors = computed(() =>
  validateLimits(parsedDaily.value, parsedTxn.value),
);
const invalid = computed(
  () =>
    !!errors.value.daily ||
    !!errors.value.txn ||
    (parsedDaily.value!.minor <= props.card.limit.daily.minor &&
      parsedTxn.value!.minor <= props.card.limit.txn.minor),
);

async function submit() {
  if (
    (
      await send.run(
        props.card.id,
        { daily: parsedDaily.value!, txn: parsedTxn.value! },
        note.value.trim() || undefined,
      )
    ).ok
  ) {
    toast("Request sent. We’ll let you know when the account owner decides.");
    emit("close");
  }
}
</script>

<template>
  <Modal
    :open="true"
    title="Ask for higher limits"
    :description="`${card.nickname} is limited to ${limitSummary(card.limit)} now.`"
    @update:open="(o) => !o && emit('close')"
  >
    <div class="space-y-4">
      <LimitFields
        v-model:daily="daily"
        v-model:txn="txn"
        :currency="cur"
        :errors="errors"
      />
      <p
        v-if="!errors.daily && !errors.txn && invalid"
        class="text-[13px] text-fg-3"
      >
        Raise at least one limit above its current value.
      </p>
      <div class="flex flex-col gap-2">
        <label for="lim-note" class="text-[14px] font-medium text-fg"
          >Why do you need it?
          <span class="font-normal text-fg-3">(optional)</span></label
        >
        <textarea
          id="lim-note"
          v-model="note"
          rows="3"
          maxlength="500"
          placeholder="e.g. Conference tickets and hotel next week."
          class="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus"
        />
      </div>
      <p
        v-if="send.error.value"
        role="alert"
        class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error"
      >
        We couldn’t send your request. Try again.
      </p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="secondary" size="sm" @click="emit('close')"
          >Cancel</ForenButton
        >
        <ForenButton
          size="sm"
          :disabled="invalid || send.pending.value"
          @click="submit"
          >{{ send.pending.value ? "Sending…" : "Send request" }}</ForenButton
        >
      </div>
    </div>
  </Modal>
</template>
