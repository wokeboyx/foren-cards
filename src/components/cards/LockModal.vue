<script setup lang="ts">
/** Admin lock: stronger than freeze. The cardholder sees who locked it and can’t ask to unfreeze. */
import { ref } from "vue";
import { RiLockLine, RiUserForbidLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import Modal from "@/components/Modal.vue";
import { COPY } from "@/content/copy";
import type { Card } from "@/domain/types";
import { lockCard } from "@/services";
import { useAction } from "@/composables/useAction";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const reason = ref("");
const lock = useAction(lockCard);

async function submit() {
  if ((await lock.run(props.card.id, reason.value.trim() || undefined)).ok) {
    toast("Card locked");
    emit("close");
  }
}
</script>

<template>
  <Modal :open="true" title="Lock this card?" @update:open="(o) => !o && emit('close')">
    <div class="space-y-4">
      <ul class="space-y-2.5 rounded-[16px] bg-subtle px-4 py-3 text-[14px] leading-[20px] text-fg">
        <li class="flex gap-2.5">
          <RiLockLine class="mt-0.5 size-[18px] shrink-0 text-fg-2" aria-hidden="true" />
          No payments or subscriptions will go through.
        </li>
        <li class="flex gap-2.5">
          <RiUserForbidLine class="mt-0.5 size-[18px] shrink-0 text-fg-2" aria-hidden="true" />
          Unlike freezing, the cardholder can’t ask to unfreeze it. Only an account admin can unlock it.
        </li>
      </ul>
      <ForenInput v-model="reason" label="Reason (optional)" :maxlength="120" placeholder="e.g. Suspected fraud, or leaving the team" description="The cardholder will see this." />
      <p v-if="lock.error.value" role="alert" class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">{{ COPY.saveFailure }}</p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="secondary" size="sm" @click="emit('close')">Go back</ForenButton>
        <ForenButton size="sm" :disabled="lock.pending.value" @click="submit">
          <template #leadingIcon><RiLockLine /></template>
          {{ lock.pending.value ? "Locking…" : "Lock card" }}
        </ForenButton>
      </div>
    </div>
  </Modal>
</template>
