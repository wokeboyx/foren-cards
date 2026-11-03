<script setup lang="ts">
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import Modal from "@/components/Modal.vue";
import LimitFields from "@/components/create/LimitFields.vue";
import { COPY } from "@/content/copy";
import { validateLimits } from "@/domain/limits";
import { parseAmount } from "@/domain/money";
import type { Card } from "@/domain/types";
import { setCardLimit } from "@/services";
import { useAction } from "@/composables/useAction";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const cur = props.card.limit.daily.currency;
const daily = ref(String(props.card.limit.daily.minor / 100));
const txn = ref(String(props.card.limit.txn.minor / 100));
const save = useAction(setCardLimit);
const parsedDaily = computed(() => parseAmount(daily.value, cur));
const parsedTxn = computed(() => parseAmount(txn.value, cur));
const errors = computed(() =>
  validateLimits(parsedDaily.value, parsedTxn.value),
);
const invalid = computed(() => !!errors.value.daily || !!errors.value.txn);
const changed = computed(
  () =>
    parsedDaily.value?.minor !== props.card.limit.daily.minor ||
    parsedTxn.value?.minor !== props.card.limit.txn.minor,
);

async function submit() {
  if (invalid.value) return;
  if (
    (
      await save.run(props.card.id, {
        daily: parsedDaily.value!,
        txn: parsedTxn.value!,
      })
    ).ok
  ) {
    toast("Limits saved");
    emit("close");
  }
}
</script>

<template>
  <Modal
    :open="true"
    title="Edit card limits"
    @update:open="(o) => !o && emit('close')"
  >
    <div class="space-y-5">
      <LimitFields
        v-model:daily="daily"
        v-model:txn="txn"
        :currency="cur"
        :errors="errors"
      />

      <p
        v-if="save.error.value"
        role="alert"
        class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error"
      >
        {{ COPY.saveFailure }}
      </p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="secondary" size="sm" @click="emit('close')"
          >Cancel</ForenButton
        >
        <ForenButton
          size="sm"
          :disabled="!changed || invalid || save.pending.value"
          @click="submit"
        >
          {{ save.pending.value ? "Saving…" : "Save limit" }}
        </ForenButton>
      </div>
    </div>
  </Modal>
</template>
