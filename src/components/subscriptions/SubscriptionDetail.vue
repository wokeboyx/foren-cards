<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RiBankCardLine, RiForbidLine, RiNotification3Line, RiSearchEyeLine } from "@/components/icons";
import { toast } from "vue-sonner";
import CardArt from "@/components/card/CardArt.vue";
import GiveOwnCardModal from "@/components/cards/GiveOwnCardModal.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import LinkButton from "@/components/LinkButton.vue";
import MerchantLogo from "@/components/MerchantLogo.vue";
import Money from "@/components/Money.vue";
import SectionTitle from "@/components/SectionTitle.vue";
import ForenBadge from "@/components/ui/ForenBadge.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import ForenToggle from "@/components/ui/ForenToggle.vue";
import { useAction } from "@/composables/useAction";
import { useNow } from "@/composables/useNow";
import { COPY, DECLINE } from "@/content/copy";
import { forecast, type SubStatus } from "@/domain/forecast";
import { FREQUENCY_LABEL } from "@/domain/labels";
import type { Card, Subscription } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { can } from "@/lib/permissions";
import { allowNextAttempt, blockMerchant, confirmBillingMoved, setReminders, unblockMerchant } from "@/services";
import { personById, useAppStore } from "@/stores/app";
import ActionRow from "./ActionRow.vue";
import SubStatusBadge from "./SubStatusBadge.vue";

const props = defineProps<{ sub: Subscription; card: Card; status: SubStatus; panel?: boolean }>();

const long = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });

const store = useAppStore();
const newCard = computed(() => store.cards.find((c) => c.id === props.sub.movingToCardId));
const now = useNow(30_000);
const m = computed(() => merchantById(props.sub.merchantId)!);
const f = computed(() => forecast(props.sub, now.value));
const owner = computed(() => can(store.role, "manageSubscriptions", props.card));
const confirm = ref<null | "block" | "own">(null);
const block = useAction(blockMerchant);
const unblock = useAction(unblockMerchant);
const allowOnce = useAction(allowNextAttempt);
const moved = useAction(confirmBillingMoved);
const rem = useAction(setReminders);
const reminders = ref({ ...props.sub.reminders });
watch(
  () => props.sub.id,
  () => (reminders.value = { ...props.sub.reminders })
);
const off = computed(() => !reminders.value.owner && !reminders.value.cardholder);
const history = computed(() => [...props.sub.chargeDates].sort().reverse());

async function saveReminders(next: Subscription["reminders"]) {
  const prev = reminders.value;
  reminders.value = next;
  if (!(await rem.run(props.sub.id, next)).ok) {
    reminders.value = prev;
    toast.error(COPY.saveFailure);
  }
}

async function onMoved() {
  if ((await moved.run(props.sub.id)).ok) toast(`${m.value.name} now charges •• ${newCard.value?.last4}`);
}
async function onUnblock() {
  if ((await unblock.run(props.card.id, props.sub.merchantId)).ok) toast(`${m.value.name} unblocked`);
}
async function onAllowOnce() {
  if ((await allowOnce.run(props.sub.id)).ok) toast("Next charge will be allowed once");
}
async function onBlock() {
  if ((await block.run(props.card.id, props.sub.merchantId)).ok) {
    toast(`${m.value.name} blocked on ${props.card.nickname}`);
    confirm.value = null;
  }
}
</script>

<template>
  <div class="space-y-6 px-5 py-5 sm:px-6">
    <div v-if="panel" class="flex items-center gap-3 pr-8">
      <MerchantLogo :merchant="m" :size="40" />
      <div class="min-w-0">
        <h2 class="truncate text-[17px] font-semibold text-fg">{{ m.name }}</h2>
        <p class="tnum truncate text-[13px] text-fg-3">{{ FREQUENCY_LABEL[sub.frequency] }} · {{ card.nickname }} •• {{ card.last4 }}</p>
      </div>
    </div>
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="text-[13px] text-fg-3">{{ COPY.estimatedNextCharge }}</div>
        <div v-if="sub.blocked" class="mt-0.5 text-[18px] font-semibold text-fg">Blocked on this card</div>
        <div v-else-if="f.kind === 'estimate'" class="mt-0.5 flex flex-wrap items-center gap-2">
          <span class="tnum text-[22px] leading-[28px] font-semibold text-fg"><Money :value="f.amount" /> · {{ long(f.date) }}</span>
          <ForenBadge size="sm" color="gray">Estimate</ForenBadge>
        </div>
        <p v-else class="mt-1 text-[14px] text-fg-2">{{ COPY.insufficientHistory }}</p>
        <p v-if="f.kind === 'estimate' && !sub.blocked" class="mt-1 text-[12px] text-fg-3">Predicted from past charges. The merchant hasn’t confirmed this date.</p>
      </div>
      <SubStatusBadge :st="status" />
    </div>

    <div v-if="status.kind === 'still_on_old_card' && newCard" class="rounded-[16px] bg-warning-subtle p-4 text-[14px] leading-[20px] text-fg">
      <p class="font-semibold text-warning">{{ COPY.stillOnOldCard }}</p>
      <p class="mt-1">
        {{ m.name }} will keep charging {{ card.nickname }} •• {{ card.last4 }} until you update your payment method with {{ m.name }} to the new card •• {{ newCard.last4 }}.
      </p>
      <ForenButton size="xs" variant="secondary" class="mt-3 bg-surface" :disabled="moved.pending.value" @click="onMoved">
        Simulate: {{ m.name }} confirmed the new card
      </ForenButton>
    </div>

    <div v-if="status.kind === 'declined' || status.kind === 'at_risk'" class="rounded-[16px] bg-warning-subtle p-4 text-[14px] text-fg">
      <p class="font-semibold text-warning">{{ status.kind === "declined" ? "Last charge declined" : "May decline next time" }}</p>
      <p class="mt-1">{{ DECLINE[status.reason].title }}</p>
    </div>

    <section>
      <SectionTitle class="mb-2">Charged to</SectionTitle>
      <div class="flex items-center gap-3">
        <CardArt :card="card" size="sm" />
        <div class="text-[14px]">
          <div class="font-medium text-fg">{{ card.nickname }} •• {{ card.last4 }}</div>
          <div class="text-fg-3">{{ personById(card.holderId)?.name }}</div>
        </div>
      </div>
    </section>

    <section>
      <SectionTitle class="mb-2">History</SectionTitle>
      <ul class="divide-y divide-line text-[14px]">
        <li v-for="d in history" :key="d" class="flex justify-between py-2">
          <span class="text-fg-2">{{ long(new Date(d)) }}</span>
          <Money :value="sub.usualAmount" class="text-fg" />
        </li>
        <li v-if="sub.lastDecline" class="flex justify-between py-2">
          <span class="text-fg-2">{{ long(new Date(sub.lastDecline.at)) }}</span>
          <span class="text-error">Declined</span>
        </li>
      </ul>
    </section>

    <section v-if="can(store.role, 'reminders', card)">
      <SectionTitle class="mb-2">
        <span class="inline-flex items-center gap-2"><RiNotification3Line class="size-[18px] text-fg-2" aria-hidden="true" /> Reminders</span>
      </SectionTitle>
      <div class="space-y-3 rounded-[16px] bg-subtle p-4">
        <ForenToggle
          size="sm"
          reverse
          class="w-full justify-between"
          label="Remind the account owner"
          :model-value="reminders.owner"
          @update:model-value="(v) => saveReminders({ ...reminders, owner: v })"
        />
        <ForenToggle
          size="sm"
          reverse
          class="w-full justify-between"
          :label="`Remind the cardholder (${personById(card.holderId)?.name.split(' ')[0]})`"
          :model-value="reminders.cardholder"
          @update:model-value="(v) => saveReminders({ ...reminders, cardholder: v })"
        />
        <div v-if="!off">
          <div class="mb-1.5 text-[13px] text-fg-2">When</div>
          <ForenSegmentedControl
            size="sm"
            aria-label="Days before"
            :model-value="String(reminders.daysBefore)"
            :options="[
              { value: '1', label: '1 day before' },
              { value: '3', label: '3 days' },
              { value: '7', label: '7 days' },
            ]"
            @update:model-value="(v) => saveReminders({ ...reminders, daysBefore: Number(v) })"
          />
        </div>
        <p class="text-[12px] text-fg-3">{{ off ? "Reminders are off for this subscription." : "Based on the estimated date, so a reminder may arrive early or late." }}</p>
      </div>
    </section>

    <section v-if="owner">
      <SectionTitle class="mb-1">Manage</SectionTitle>
      <ActionRow v-if="!sub.blocked" title="Block merchant on this card" body="Declines future charges from this merchant on this card only.">
        <template #icon><RiForbidLine /></template>
        <template #action>
          <ForenButton size="xs" variant="outline" destructive @click="confirm = 'block'">Block</ForenButton>
        </template>
      </ActionRow>
      <ActionRow
        v-else
        :title="sub.allowNextAttempt ? 'Next attempt will be allowed' : 'Blocked on this card'"
        :body="sub.allowNextAttempt ? 'The next charge goes through once, then the block applies again.' : 'You can unblock it, or let only the next charge through.'"
      >
        <template #icon><RiForbidLine /></template>
        <template #action>
          <div class="flex flex-col gap-1.5">
            <ForenButton size="xs" variant="outline" :disabled="unblock.pending.value" @click="onUnblock">Unblock</ForenButton>
            <ForenButton v-if="!sub.allowNextAttempt" size="xs" variant="ghost" :disabled="allowOnce.pending.value" @click="onAllowOnce">Allow next only</ForenButton>
          </div>
        </template>
      </ActionRow>
      <ActionRow
        v-if="!sub.movingToCardId && !card.lockedMerchantId && !sub.blocked"
        title="Give it its own card"
        :body="`Creates a card locked to ${m.name}, so you can manage it without affecting ${card.nickname}.`"
      >
        <template #icon><RiBankCardLine /></template>
        <template #action>
          <ForenButton size="xs" variant="outline" @click="confirm = 'own'">Create card</ForenButton>
        </template>
      </ActionRow>
      <ActionRow title="Check compatibility" body="See whether this merchant is likely to accept a card.">
        <template #icon><RiSearchEyeLine /></template>
        <template #action>
          <LinkButton size="xs" variant="outline" :href="`/cards/check-merchant?card=${sub.movingToCardId ?? card.id}&merchant=${m.id}`">Check</LinkButton>
        </template>
      </ActionRow>
      <p v-if="block.error.value || unblock.error.value || allowOnce.error.value || moved.error.value" role="alert" class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">
        {{ COPY.saveFailure }}
      </p>
    </section>

    <ConfirmDialog
      :open="confirm === 'block'"
      :title="`Block ${m.name} on ${card.nickname}?`"
      :consequence="COPY.blockMerchantConfirm"
      confirm-label="Block merchant"
      destructive
      :pending="block.pending.value"
      :error="block.error.value ? COPY.saveFailure : null"
      @update:open="(o) => !o && (confirm = null)"
      @confirm="onBlock"
    />
    <GiveOwnCardModal v-if="confirm === 'own'" :card="card" :merchant="m" @close="confirm = null" />
  </div>
</template>
