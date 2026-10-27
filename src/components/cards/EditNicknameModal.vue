<script setup lang="ts">
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import CardArt from "@/components/card/CardArt.vue";
import CardStatusBadge from "@/components/card/CardStatusBadge.vue";
import Modal from "@/components/Modal.vue";
import { COPY } from "@/content/copy";
import type { Card } from "@/domain/types";
import { renameCard } from "@/services";
import { useAction } from "@/composables/useAction";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const name = ref(props.card.nickname);
const save = useAction(renameCard);
const trimmed = computed(() => name.value.trim());
const valid = computed(() => trimmed.value.length > 0 && trimmed.value.length <= 40);

async function submit() {
  if ((await save.run(props.card.id, trimmed.value)).ok) {
    toast("Nickname saved");
    emit("close");
  }
}
</script>

<template>
  <Modal :open="true" title="Change card nickname" @update:open="(o) => !o && emit('close')">
    <ForenInput
      v-model="name"
      aria-label="Card nickname"
      :maxlength="60"
      :description="trimmed.length > 40 ? undefined : 'Something short but memorable.'"
      :error="trimmed.length > 40 ? 'Use 40 characters or fewer.' : undefined"
    />
    <div class="mt-4 flex items-center gap-3 rounded-[16px] border border-line p-3">
      <CardArt :card="{ ...card, nickname: trimmed || 'Card name' }" size="sm" />
      <div class="min-w-0 flex-1">
        <div class="truncate text-[14px] font-semibold text-fg">{{ trimmed || "Card name" }}</div>
        <div class="text-[12px] text-fg-3">•• {{ card.last4 }}</div>
      </div>
      <CardStatusBadge :card="card" size="sm" />
    </div>
    <p v-if="save.error.value" role="alert" class="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">{{ COPY.saveFailure }}</p>
    <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <ForenButton variant="secondary" size="sm" @click="emit('close')">Go back</ForenButton>
      <ForenButton size="sm" :disabled="!valid || trimmed === card.nickname || save.pending.value" @click="submit">
        {{ save.pending.value ? "Saving…" : "Save" }}
      </ForenButton>
    </div>
  </Modal>
</template>
