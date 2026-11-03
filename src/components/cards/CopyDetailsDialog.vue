<script setup lang="ts">
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInfoNote from "@/components/ui/ForenInfoNote.vue";
import Modal from "@/components/Modal.vue";
import { nameOnCard } from "@/components/card/holder";
import type { Card } from "@/domain/types";
import { copyToClipboard } from "./card-detail";
import DetailCopy from "./DetailCopy.vue";

const props = defineProps<{ card: Card; open: boolean; allowed: boolean }>();
const emit = defineEmits<{ close: [] }>();

const revealed = ref(false);
// Test number only — Visa test range.
const pan = computed(() => `4000 0012 3456 ${props.card.last4}`);
const expiry = computed(
  () => `${props.card.expiry.slice(5)}/${props.card.expiry.slice(2, 4)}`,
);
const holder = computed(() => nameOnCard(props.card) ?? "");

async function copy(label: string, value: string) {
  await copyToClipboard(value);
  toast(`${label} copied`);
}
</script>

<template>
  <Modal
    :open="open"
    title="Card details"
    :description="
      allowed ? 'Share these only with the intended cardholder.' : undefined
    "
    @update:open="(o) => !o && emit('close')"
  >
    <ForenInfoNote
      v-if="!allowed"
      intent="default"
      size="lg"
      class="h-auto rounded-[16px] py-3 [&>span]:whitespace-normal"
    >
      Only the cardholder and the account owner can see this card’s full
      details.
    </ForenInfoNote>
    <div v-else class="space-y-3">
      <div
        class="inline-flex rounded-full bg-warning-subtle px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.06em] text-warning uppercase"
      >
        Test data
      </div>
      <DetailCopy
        label="Card number"
        :value="revealed ? pan : `•••• •••• •••• ${card.last4}`"
        :can-copy="revealed"
        @copy="copy('Card number', pan)"
      />
      <div class="grid grid-cols-2 gap-3">
        <DetailCopy
          label="Expiry"
          :value="expiry"
          can-copy
          @copy="copy('Expiry', expiry)"
        />
        <DetailCopy
          label="CVC"
          :value="revealed ? '123' : '•••'"
          :can-copy="revealed"
          @copy="copy('CVC', '123')"
        />
      </div>
      <DetailCopy
        label="Name on card"
        :value="holder"
        can-copy
        @copy="copy('Name', holder)"
      />
      <ForenButton
        variant="secondary"
        size="sm"
        class="w-full"
        @click="revealed = !revealed"
      >
        {{ revealed ? "Hide details" : "Show full details" }}
      </ForenButton>
    </div>
    <ForenButton
      variant="outline"
      size="sm"
      class="mt-3 w-full"
      @click="emit('close')"
      >Done</ForenButton
    >
  </Modal>
</template>
