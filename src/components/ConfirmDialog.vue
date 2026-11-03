<script setup lang="ts">
/** Confirmation that states the consequence before a risky or destructive action (§4). Slots: default (extra fields), consequence. */
import ForenButton from "@/components/ui/ForenButton.vue";
import Modal from "./Modal.vue";

defineProps<{
  open: boolean;
  title: string;
  consequence?: string;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  cancelLabel?: string;
  error?: string | null;
}>();
const emit = defineEmits<{ "update:open": [open: boolean]; confirm: [] }>();
const slots = defineSlots<{ default?(): unknown; consequence?(): unknown }>();
</script>

<template>
  <Modal
    :open="open"
    :title="title"
    :description="consequence"
    @update:open="emit('update:open', $event)"
  >
    <template v-if="slots.consequence" #description
      ><slot name="consequence"
    /></template>
    <slot />
    <p
      v-if="error"
      role="alert"
      class="mb-4 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] leading-[18px] text-error"
    >
      {{ error }}
    </p>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <ForenButton
        variant="outline"
        size="sm"
        :disabled="pending"
        @click="emit('update:open', false)"
        >{{ cancelLabel ?? "Keep as is" }}</ForenButton
      >
      <ForenButton
        size="sm"
        :destructive="destructive"
        :disabled="pending"
        @click="emit('confirm')"
      >
        {{ pending ? "Working…" : confirmLabel }}
      </ForenButton>
    </div>
  </Modal>
</template>
