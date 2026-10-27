<script setup lang="ts">
/** Small confirmation modal that shows which card is affected (Mercury freeze/cancel pattern). Slots: body, icon. */
import { RiSnowflakeLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import CardArt from "@/components/card/CardArt.vue";
import Modal from "@/components/Modal.vue";
import { COPY } from "@/content/copy";
import type { Card } from "@/domain/types";
import { useAction } from "@/composables/useAction";
import { cn } from "@/lib/utils";

const props = defineProps<{
  open: boolean;
  card: Card;
  title: string;
  body?: string;
  confirmLabel: string;
  destructive?: boolean;
  action: (id: string) => Promise<unknown>;
  okToast: string;
  /** A reversible option offered next to a destructive one (Revolut: "Freeze card temporarily"). */
  alternative?: { label: string; onClick: () => void };
}>();
const emit = defineEmits<{ close: [] }>();
defineSlots<{ body?(): unknown; icon?(): unknown }>();

const a = useAction(props.action);

async function confirm() {
  if ((await a.run(props.card.id)).ok) {
    toast(props.okToast);
    emit("close");
  }
}
</script>

<template>
  <Modal :open="open" :title="title" @update:open="(o) => !o && emit('close')">
    <div class="flex items-center gap-3 border-y border-line py-3">
      <CardArt :card="card" size="xs" />
      <div class="min-w-0">
        <div class="truncate text-[14px] font-medium text-fg">{{ card.nickname }}</div>
        <div class="text-[12px] text-fg-3">Card •• {{ card.last4 }}</div>
      </div>
    </div>
    <div class="mt-3 text-[14px] leading-[21px] text-fg-2"><slot name="body">{{ body }}</slot></div>
    <p v-if="a.error.value" role="alert" class="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">
      {{ COPY.saveFailure }}
    </p>
    <div :class="cn('mt-5 flex flex-col-reverse gap-2', !alternative && 'sm:flex-row sm:justify-end')">
      <ForenButton variant="secondary" size="sm" :disabled="a.pending.value" @click="emit('close')">Go back</ForenButton>
      <ForenButton v-if="alternative" variant="outline" size="sm" :disabled="a.pending.value" @click="alternative.onClick">
        <template #leadingIcon><RiSnowflakeLine /></template>
        {{ alternative.label }}
      </ForenButton>
      <ForenButton size="sm" :destructive="destructive" :disabled="a.pending.value" @click="confirm">
        <template v-if="$slots.icon" #leadingIcon><slot name="icon" /></template>
        {{ a.pending.value ? "Working…" : confirmLabel }}
      </ForenButton>
    </div>
  </Modal>
</template>
