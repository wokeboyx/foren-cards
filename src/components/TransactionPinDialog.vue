<script setup lang="ts">
// Transaction PIN check before approving (Figma Settings › Security: "Transaction PIN — Required to approve
// payments"). Six single-digit boxes; the decision only runs once the PIN is confirmed.
import Modal from "@/components/Modal.vue";
import PinForm from "@/components/TransactionPinForm.vue";

withDefaults(
  defineProps<{
    /** What the PIN approves, e.g. "Approve once". */
    action: string;
    /** Shown under the title. Defaults to the approval wording. */
    description?: string;
    /** Button text while the action runs. */
    busyLabel?: string;
    /** Shown when the action fails after the PIN was accepted. */
    failureText?: string;
    /** Runs the approval once the PIN is accepted; resolve false to show a failure. Pass as `@confirm` or `:on-confirm`. */
    onConfirm: () => Promise<boolean>;
  }>(),
  {
    description: "Enter your 6-digit transaction PIN to continue.",
    busyLabel: "Approving…",
    failureText: "We couldn’t approve this. Try again.",
  },
);
const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <Modal
    v-model:open="open"
    title="Enter your transaction PIN"
    :description="description"
  >
    <PinForm
      v-if="open"
      :action="action"
      :busy-label="busyLabel"
      :failure-text="failureText"
      :on-confirm="onConfirm"
      @cancel="open = false"
    />
  </Modal>
</template>
