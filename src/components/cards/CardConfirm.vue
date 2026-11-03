<script setup lang="ts">
/** Small confirmation modal that shows which card is affected (Mercury freeze/cancel pattern). Slots: body, icon. */
import { RiSnowflakeLine } from "@/components/icons";
import { ref } from "vue";
import { toast } from "vue-sonner";
import TransactionPinDialog from "@/components/TransactionPinDialog.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import CardArt from "@/components/card/CardArt.vue";
import Modal from "@/components/Modal.vue";
import { COPY } from "@/content/copy";
import type { Card } from "@/domain/types";
import { useAction } from "@/composables/useAction";

const props = defineProps<{
  open: boolean;
  card: Card;
  title: string;
  body?: string;
  confirmLabel: string;
  destructive?: boolean;
  /** Ask for the transaction PIN before running the action. */
  requirePin?: boolean;
  /** Leave out the "Go back" button (the close button still dismisses the dialog). */
  hideBack?: boolean;
  action: (id: string) => Promise<unknown>;
  okToast: string;
  /** A reversible option offered next to a destructive one (Revolut: "Freeze card temporarily"). */
  alternative?: { label: string; onClick: () => void };
}>();
const emit = defineEmits<{ close: [] }>();
defineSlots<{ body?(): unknown; icon?(): unknown }>();

const a = useAction(props.action);

const pinOpen = ref(false);

/** Runs the action; with `requirePin` it only runs once the PIN has been accepted. */
async function run(): Promise<boolean> {
  if (!(await a.run(props.card.id)).ok) return false;
  pinOpen.value = false;
  toast(props.okToast);
  emit("close");
  return true;
}
function confirm() {
  if (props.requirePin) pinOpen.value = true;
  else void run();
}
</script>

<template>
  <Modal :open="open" :title="title" @update:open="(o) => !o && emit('close')">
    <div class="space-y-4">
      <!-- The card affected, as the Figma "card" row -->
      <div
        class="flex items-center gap-3 rounded-[20px] border-[0.7px] border-[var(--color-foren-border-muted)] bg-surface p-3"
      >
        <CardArt :card="card" size="xs" />
        <div class="min-w-0">
          <div
            class="truncate text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg"
          >
            {{ card.nickname }}
          </div>
          <div class="text-[12px] leading-[18px] tracking-[0.12px] text-fg-2">
            Card •• {{ card.last4 }}
          </div>
        </div>
      </div>
      <div
        class="text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg-2"
      >
        <slot name="body">{{ body }}</slot>
      </div>
      <p
        v-if="a.error.value"
        role="alert"
        class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error"
      >
        {{ COPY.saveFailure }}
      </p>
    </div>
    <template #footer>
      <ForenButton
        v-if="!hideBack"
        variant="outline"
        size="sm"
        :disabled="a.pending.value"
        @click="emit('close')"
        >Go back</ForenButton
      >
      <ForenButton
        v-if="alternative"
        variant="outline"
        size="sm"
        :disabled="a.pending.value"
        @click="alternative.onClick"
      >
        <template #leadingIcon><RiSnowflakeLine /></template>
        {{ alternative.label }}
      </ForenButton>
      <ForenButton
        size="sm"
        :destructive="destructive"
        :disabled="a.pending.value"
        @click="confirm"
      >
        <template v-if="$slots.icon" #leadingIcon
          ><slot name="icon"
        /></template>
        {{ a.pending.value ? "Working…" : confirmLabel }}
      </ForenButton>
    </template>
  </Modal>
  <TransactionPinDialog
    v-if="requirePin"
    v-model:open="pinOpen"
    :action="confirmLabel"
    busy-label="Working…"
    description="Enter your 6-digit transaction PIN to confirm."
    :failure-text="COPY.saveFailure"
    :on-confirm="run"
  />
</template>
