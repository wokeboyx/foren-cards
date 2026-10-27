<script setup lang="ts">
/** Spending period (Revolut): the card only works between two dates, e.g. a conference week. */
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import Modal from "@/components/Modal.vue";
import { COPY } from "@/content/copy";
import type { Card } from "@/domain/types";
import { setSpendingPeriod } from "@/services";
import { useAction } from "@/composables/useAction";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const from = ref(props.card.activeFrom ?? "");
const until = ref(props.card.activeUntil ?? "");
const save = useAction(setSpendingPeriod);
const bad = computed(() => !!from.value && !!until.value && until.value < from.value);

async function remove() {
  if ((await save.run(props.card.id, undefined, undefined)).ok) {
    toast("Spending period removed");
    emit("close");
  }
}
async function submit() {
  if ((await save.run(props.card.id, from.value || undefined, until.value || undefined)).ok) {
    toast("Spending period saved");
    emit("close");
  }
}
</script>

<template>
  <Modal
    :open="true"
    title="Spending period"
    description="The card only works between these dates. Payments outside them are declined. Leave a date empty to have no start or end."
    @update:open="(o) => !o && emit('close')"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <ForenInput v-model="from" label="From" type="date" />
        <ForenInput v-model="until" label="Until" type="date" :error="bad ? 'Must be on or after the start date.' : undefined" />
      </div>
      <p v-if="save.error.value" role="alert" class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">{{ COPY.saveFailure }}</p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <ForenButton v-if="card.activeFrom || card.activeUntil" variant="ghost" size="sm" @click="remove">Remove period</ForenButton>
        <span v-else />
        <div class="flex flex-col-reverse gap-2 sm:flex-row">
          <ForenButton variant="secondary" size="sm" @click="emit('close')">Cancel</ForenButton>
          <ForenButton size="sm" :disabled="bad || (!from && !until) || save.pending.value" @click="submit">Save</ForenButton>
        </div>
      </div>
    </div>
  </Modal>
</template>
