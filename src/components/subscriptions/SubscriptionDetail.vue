<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RiBankCardLine, RiNotification3Line } from "@/components/icons";
import { toast } from "vue-sonner";
import CardArt from "@/components/card/CardArt.vue";
import GiveOwnCardModal from "@/components/cards/GiveOwnCardModal.vue";
import MerchantLogo from "@/components/MerchantLogo.vue";
import Money from "@/components/Money.vue";
import SectionTitle from "@/components/SectionTitle.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenSegmentedControl from "@/components/ui/ForenSegmentedControl.vue";
import ForenToggle from "@/components/ui/ForenToggle.vue";
import { useAction } from "@/composables/useAction";
import { COPY, DECLINE } from "@/content/copy";
import type { SubStatus } from "@/domain/forecast";
import { FREQUENCY_LABEL } from "@/domain/labels";
import type { Card, Subscription } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { can } from "@/lib/permissions";
import { confirmBillingMoved, setReminders } from "@/services";
import { personById, useAppStore } from "@/stores/app";
import ActionRow from "./ActionRow.vue";
import SubStatusBadge from "./SubStatusBadge.vue";

const props = defineProps<{
  sub: Subscription;
  card: Card;
  status: SubStatus;
  panel?: boolean;
}>();

const long = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

const store = useAppStore();
const newCard = computed(() =>
  store.cards.find((c) => c.id === props.sub.movingToCardId),
);
const m = computed(() => merchantById(props.sub.merchantId)!);
const owner = computed(() =>
  can(store.role, "manageSubscriptions", props.card),
);
const confirm = ref<null | "own">(null);
const moved = useAction(confirmBillingMoved);
const rem = useAction(setReminders);
const reminders = ref({ ...props.sub.reminders });
watch(
  () => props.sub.id,
  () => (reminders.value = { ...props.sub.reminders }),
);
const off = computed(
  () => !reminders.value.owner && !reminders.value.cardholder,
);
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
  if ((await moved.run(props.sub.id)).ok)
    toast(`${m.value.name} now charges •• ${newCard.value?.last4}`);
}
</script>

<template>
  <div class="space-y-6 px-5 py-5 sm:px-6">
    <div v-if="panel" class="flex items-center gap-3 pr-8">
      <MerchantLogo :merchant="m" :size="40" />
      <div class="min-w-0">
        <h2 class="truncate text-[17px] font-semibold text-fg">{{ m.name }}</h2>
        <p class="tnum truncate text-[13px] text-fg-3">
          {{ FREQUENCY_LABEL[sub.frequency] }} · {{ card.nickname }} ••
          {{ card.last4 }}
        </p>
      </div>
    </div>
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="text-[13px] text-fg-3">Usual charge</div>
        <div
          class="tnum mt-0.5 text-[22px] leading-[28px] font-semibold text-fg"
        >
          <Money :value="sub.usualAmount" />
        </div>
      </div>
      <SubStatusBadge :st="status" />
    </div>

    <div
      v-if="status.kind === 'still_on_old_card' && newCard"
      class="rounded-[16px] bg-warning-subtle p-4 text-[14px] leading-[20px] text-fg"
    >
      <p class="font-semibold text-warning">{{ COPY.stillOnOldCard }}</p>
      <p class="mt-1">
        {{ m.name }} will keep charging {{ card.nickname }} ••
        {{ card.last4 }} until you update your payment method with
        {{ m.name }} to the new card •• {{ newCard.last4 }}.
      </p>
      <ForenButton
        size="xs"
        variant="secondary"
        class="mt-3 bg-surface"
        :disabled="moved.pending.value"
        @click="onMoved"
      >
        Simulate: {{ m.name }} confirmed the new card
      </ForenButton>
    </div>

    <div
      v-if="status.kind === 'declined' || status.kind === 'at_risk'"
      class="rounded-[16px] bg-warning-subtle p-4 text-[14px] text-fg"
    >
      <p class="font-semibold text-warning">
        {{
          status.kind === "declined"
            ? "Last charge declined"
            : "May decline next time"
        }}
      </p>
      <p class="mt-1">{{ DECLINE[status.reason].title }}</p>
    </div>

    <section>
      <SectionTitle class="mb-2">Charged to</SectionTitle>
      <div class="flex items-center gap-3">
        <CardArt :card="card" size="sm" />
        <div class="text-[14px]">
          <div class="font-medium text-fg">
            {{ card.nickname }} •• {{ card.last4 }}
          </div>
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
          <span class="text-fg-2">{{
            long(new Date(sub.lastDecline.at))
          }}</span>
          <span class="text-error">Declined</span>
        </li>
      </ul>
    </section>

    <section v-if="can(store.role, 'reminders', card)">
      <SectionTitle class="mb-2">
        <span class="inline-flex items-center gap-2"
          ><RiNotification3Line
            class="size-[18px] text-fg-2"
            aria-hidden="true"
          />
          Reminders</span
        >
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
          @update:model-value="
            (v) => saveReminders({ ...reminders, cardholder: v })
          "
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
            @update:model-value="
              (v) => saveReminders({ ...reminders, daysBefore: Number(v) })
            "
          />
        </div>
        <p class="text-[12px] text-fg-3">
          {{
            off
              ? "Reminders are off for this subscription."
              : "Sent before each charge."
          }}
        </p>
      </div>
    </section>

    <section v-if="owner">
      <SectionTitle class="mb-1">Manage</SectionTitle>
      <ActionRow
        v-if="!sub.movingToCardId"
        title="Give it its own card"
        :body="`Creates a separate card for ${m.name}, so you can manage it without affecting ${card.nickname}.`"
      >
        <template #icon><RiBankCardLine /></template>
        <template #action>
          <ForenButton size="xs" variant="outline" @click="confirm = 'own'"
            >Create card</ForenButton
          >
        </template>
      </ActionRow>
      <p
        v-if="moved.error.value"
        role="alert"
        class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error"
      >
        {{ COPY.saveFailure }}
      </p>
    </section>

    <GiveOwnCardModal
      v-if="confirm === 'own'"
      :card="card"
      :merchant="m"
      @close="confirm = null"
    />
  </div>
</template>
