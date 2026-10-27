<script setup lang="ts">
/** Every dialog a card's actions can open. Give it a `:key` per dialog so inputs reset between opens. */
import { ref } from "vue";
import { RiArchiveLine, RiLockUnlockLine, RiSnowflakeLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import CardHistoryList from "@/components/card/CardHistoryList.vue";
import CancelConsequences from "@/components/card/CancelConsequences.vue";
import Modal from "@/components/Modal.vue";
import type { Card } from "@/domain/types";
import { archiveCard, cancelCard, freezeCard, requestUnfreeze, unfreezeCard, unlockCard } from "@/services";
import { useAction } from "@/composables/useAction";
import { can } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";
import type { DialogKind } from "./card-detail";
import CardConfirm from "./CardConfirm.vue";
import CopyDetailsDialog from "./CopyDetailsDialog.vue";
import EditLimitModal from "./EditLimitModal.vue";
import EditNicknameModal from "./EditNicknameModal.vue";
import LimitRequestModal from "./LimitRequestModal.vue";
import LockModal from "./LockModal.vue";
import PeriodModal from "./PeriodModal.vue";

defineProps<{ card: Card }>();
const dialog = defineModel<DialogKind>("dialog", { required: true });

const store = useAppStore();
const close = () => (dialog.value = null);
const reqUnfreeze = useAction(requestUnfreeze);
const note = ref("");

async function sendUnfreeze(cardId: string) {
  if ((await reqUnfreeze.run(cardId, note.value || undefined)).ok) {
    toast("Unfreeze requested. We’ll let you know when the owner decides.");
    close();
  }
}
</script>

<template>
  <CardConfirm
    :open="dialog === 'freeze'"
    :card="card"
    title="Are you sure you want to freeze this card?"
    body="New charges and subscriptions on this card will fail while it’s frozen. Nothing is canceled, and it can be unfrozen later."
    confirm-label="Freeze card"
    :action="freezeCard"
    ok-toast="Card frozen"
    @close="close"
  >
    <template #icon><RiSnowflakeLine /></template>
  </CardConfirm>
  <CardConfirm
    :open="dialog === 'unfreeze'"
    :card="card"
    title="Unfreeze this card?"
    body="New charges and subscriptions can go through again, within the card’s limits and permissions."
    confirm-label="Unfreeze card"
    :action="unfreezeCard"
    ok-toast="Card unfrozen"
    @close="close"
  />
  <CardConfirm
    :open="dialog === 'cancel'"
    :card="card"
    :title="`Cancel the card ending in •• ${card.last4}?`"
    confirm-label="Cancel card permanently"
    destructive
    :action="cancelCard"
    ok-toast="Card canceled"
    :alternative="card.status === 'active' && can(store.role, 'freeze', card) ? { label: 'Freeze instead', onClick: () => (dialog = 'freeze') } : undefined"
    @close="close"
  >
    <template #body><CancelConsequences :can-freeze="card.status === 'active'" /></template>
  </CardConfirm>
  <Modal
    :open="dialog === 'history'"
    title="History"
    :description="`${card.nickname} •• ${card.last4} · what changed, when, and who did it.`"
    @update:open="(o) => !o && close()"
  >
    <div class="-mt-2 max-h-[60dvh] overflow-y-auto">
      <CardHistoryList :card="card" />
    </div>
    <ForenButton variant="secondary" size="sm" class="mt-3 w-full" @click="close">Done</ForenButton>
  </Modal>
  <CardConfirm
    :open="dialog === 'archive'"
    :card="card"
    title="Archive this card?"
    body="Archiving moves this canceled card out of your main list and into Archived. It doesn’t change anything else — the card is already canceled, and its history is kept."
    confirm-label="Archive"
    :action="archiveCard"
    ok-toast="Card archived. Find it under Archived."
    @close="close"
  >
    <template #icon><RiArchiveLine /></template>
  </CardConfirm>
  <Modal
    :open="dialog === 'request-unfreeze'"
    title="Ask to unfreeze this card"
    description="Only the account owner can unfreeze it. We’ll send them your request with this card’s details."
    @update:open="(o) => !o && close()"
  >
    <label class="mb-1.5 block text-[14px] font-medium text-fg" for="unfreeze-note">
      Note for the owner <span class="font-normal text-fg-3">(optional)</span>
    </label>
    <textarea
      id="unfreeze-note"
      v-model="note"
      rows="3"
      class="w-full rounded-[16px] bg-subtle px-3 py-2.5 text-[14px] text-fg outline-none focus:bg-surface focus:ring-2 focus:ring-focus"
      placeholder="e.g. Found the card — it was in my bag."
    />
    <p v-if="reqUnfreeze.error.value" role="alert" class="mt-3 rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">We couldn’t send your request. Try again.</p>
    <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <ForenButton variant="secondary" size="sm" @click="close">Go back</ForenButton>
      <ForenButton size="sm" :disabled="reqUnfreeze.pending.value" @click="sendUnfreeze(card.id)">
        {{ reqUnfreeze.pending.value ? "Sending…" : "Request unfreeze" }}
      </ForenButton>
    </div>
  </Modal>
  <EditLimitModal v-if="dialog === 'limit'" :card="card" @close="close" />
  <LimitRequestModal v-if="dialog === 'limit-request'" :card="card" @close="close" />
  <LockModal v-if="dialog === 'lock'" :card="card" @close="close" />
  <PeriodModal v-if="dialog === 'period'" :card="card" @close="close" />
  <CardConfirm
    :open="dialog === 'unlock'"
    :card="card"
    title="Unlock this card?"
    body="Payments and subscriptions can go through again, within the card’s limits and permissions."
    confirm-label="Unlock card"
    :action="unlockCard"
    ok-toast="Card unlocked"
    @close="close"
  >
    <template #icon><RiLockUnlockLine /></template>
  </CardConfirm>
  <EditNicknameModal v-if="dialog === 'nickname'" :card="card" @close="close" />
  <CopyDetailsDialog :card="card" :open="dialog === 'copy'" :allowed="can(store.role, 'viewDetails', card)" @close="close" />
</template>
