<script setup lang="ts">
// Transaction PIN check before approving (Figma Settings › Security: "Transaction PIN — Required to approve
// payments"). Four single-digit boxes; the decision only runs once the PIN is confirmed.
import Modal from "@/components/Modal.vue";
import PinForm from "@/components/TransactionPinForm.vue";

defineProps<{
  /** What the PIN approves, e.g. "Approve once". */
  action: string;
  /** Runs the approval once the PIN is accepted; resolve false to show a failure. Pass as `@confirm` or `:on-confirm`. */
  onConfirm: () => Promise<boolean>;
}>();
const open = defineModel<boolean>("open", { required: true });
</script>

<template>
  <Modal v-model:open="open" title="Enter your transaction PIN" description="Your PIN is needed to approve requests.">
    <PinForm v-if="open" :action="action" :on-confirm="onConfirm" @cancel="open = false" />
  </Modal>
</template>
