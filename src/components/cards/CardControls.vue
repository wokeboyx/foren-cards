<script setup lang="ts">
/**
 * Card controls in the Settings › Security pattern: each row says what the control does and
 * what it's set to now, with a switch (applies straight away) or a Change button.
 */
import { computed } from "vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenToggle from "@/components/ui/ForenToggle.vue";
import LinkButton from "@/components/LinkButton.vue";
import { permissionSentence } from "@/components/card/funding-path";
import { spentInPeriod } from "@/domain/authorize";
import { PERIOD_PHRASE, strategyLabel } from "@/domain/labels";
import { format } from "@/domain/money";
import type { Card, CardControls } from "@/domain/types";
import { DEFAULT_CONTROLS, freezeCard, unfreezeCard, updateCard } from "@/services";
import { useAction } from "@/composables/useAction";
import { useNow } from "@/composables/useNow";
import { can } from "@/lib/permissions";
import { currentUserId, useAppStore } from "@/stores/app";
import type { DialogKind } from "./card-detail";
import ControlGroup from "./ControlGroup.vue";
import ControlRow from "./ControlRow.vue";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ pick: [d: DialogKind] }>();

const store = useAppStore();
const now = useNow(30_000);
const save = useAction(updateCard);
const freeze = useAction(freezeCard);
const unfreeze = useAction(unfreezeCard);
const me = computed(() => currentUserId(store.role));
const canEdit = computed(() => can(store.role, "edit", props.card) && props.card.kind !== "emergency");
const canUnfreeze = computed(() => can(store.role, "unfreeze", props.card));
const canCancel = computed(() => can(store.role, "cancel", props.card));
const controls = computed(() => props.card.controls ?? DEFAULT_CONTROLS);
const frozen = computed(() => props.card.status === "frozen");

async function setControl(k: keyof CardControls, v: boolean, done: string) {
  if ((await save.run(props.card.id, { controls: { ...controls.value, [k]: v } })).ok) toast(done);
}
async function setFrozen(v: boolean) {
  const r = v ? await freeze.run(props.card.id) : await unfreeze.run(props.card.id);
  if (r.ok) toast(v ? "Card frozen" : "Card unfrozen");
}

const limitValue = computed(() => {
  const c = props.card;
  if (c.limit.period === "per_txn") return `Up to ${format(c.limit.amount)} per charge`;
  const spent = spentInPeriod(c, store.transactions, now.value);
  return `${format(c.limit.amount)} ${PERIOD_PHRASE[c.limit.period]} · ${format({ minor: Math.max(0, c.limit.amount.minor - spent.minor), currency: spent.currency })} left`;
});
const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const period = computed(() =>
  props.card.activeFrom || props.card.activeUntil
    ? `${props.card.activeFrom ? shortDate(props.card.activeFrom) : "Now"} – ${props.card.activeUntil ? shortDate(props.card.activeUntil) : "no end"}`
    : "Any day"
);
const freezeDesc = computed(() =>
  props.card.adminLock
    ? `Locked by ${props.card.adminLock.by}. Only an admin can unlock it.`
    : frozen.value && !canUnfreeze.value
      ? "Frozen. Only the account owner can unfreeze it."
      : frozen.value
        ? "All payments are declined."
        : "Stops all payments until you turn it off."
);

const FUNDING_HINT: Record<Card["funding"]["strategy"], string> = {
  cheapest_fx: "lowest cost per charge",
  protect: "spent last",
  custom: "your order",
};
</script>

<template>
  <div v-if="card.status !== 'canceled'">
    <p class="text-[14px] leading-[21px] text-fg-2">
      {{ canEdit ? "Changes apply straight away." : "Only the account owner can change these." }}
    </p>

    <ControlGroup title="Payments">
      <ControlRow title="Freeze card" :desc="freezeDesc">
        <template #action>
          <template v-if="card.adminLock">
            <ForenButton v-if="canUnfreeze" variant="outline" size="xxs" @click="emit('pick', 'unlock')">Unlock</ForenButton>
            <span v-else class="text-[12px] font-medium text-fg-3">Locked</span>
          </template>
          <ForenButton v-else-if="frozen && !canUnfreeze" variant="outline" size="xxs" @click="emit('pick', 'request-unfreeze')">Ask to unfreeze</ForenButton>
          <ForenToggle
            v-else
            aria-label="Freeze card"
            :model-value="frozen"
            :disabled="!can(store.role, 'freeze', card) || freeze.pending.value || unfreeze.pending.value"
            @update:model-value="setFrozen"
          />
        </template>
      </ControlRow>
      <ControlRow title="Payments in other currencies" :desc="controls.foreignCurrency ? 'USD, GBP, EUR and CAD charges are allowed.' : 'Only NGN charges go through.'">
        <template #action>
          <ForenToggle
            aria-label="Payments in other currencies"
            :model-value="controls.foreignCurrency"
            :disabled="!canEdit || save.pending.value"
            @update:model-value="(v) => setControl('foreignCurrency', v, v ? 'Payments in other currencies turned on' : 'Payments in other currencies turned off')"
          />
        </template>
      </ControlRow>
      <ControlRow title="Payments without a security code" :desc="controls.non3ds ? 'Allowed. Most subscriptions need this.' : 'Only payments with a security code go through.'">
        <template #action>
          <ForenToggle
            aria-label="Payments without a security code"
            :model-value="controls.non3ds"
            :disabled="!canEdit || save.pending.value"
            @update:model-value="(v) => setControl('non3ds', v, v ? 'Payments without a security code turned on' : 'Payments without a security code turned off')"
          />
        </template>
      </ControlRow>
    </ControlGroup>

    <ControlGroup title="Limits and rules">
      <ControlRow title="Spending limit" :desc="limitValue">
        <template v-if="canEdit" #action><ForenButton variant="outline" size="xxs" @click="emit('pick', 'limit')">Change</ForenButton></template>
        <template v-else-if="card.holderId === me && card.status === 'active'" #action>
          <ForenButton variant="outline" size="xxs" @click="emit('pick', 'limit-request')">Ask for more</ForenButton>
        </template>
      </ControlRow>
      <ControlRow title="Where it can be used" :desc="permissionSentence(card)">
        <template v-if="canEdit" #action><LinkButton :href="`/cards/${card.id}/edit`" variant="outline" size="xxs">Change</LinkButton></template>
      </ControlRow>
      <ControlRow title="Spending period" :desc="period">
        <template v-if="canEdit" #action>
          <ForenButton variant="outline" size="xxs" @click="emit('pick', 'period')">{{ card.activeFrom || card.activeUntil ? "Change" : "Set dates" }}</ForenButton>
        </template>
      </ControlRow>
      <ControlRow title="Which balance pays" :desc="`${strategyLabel(card.funding)} · ${FUNDING_HINT[card.funding.strategy]}`">
        <template v-if="canEdit" #action><LinkButton :href="`/cards/${card.id}/edit`" variant="outline" size="xxs">Change</LinkButton></template>
      </ControlRow>
    </ControlGroup>

    <ControlGroup title="Manage card">
      <ControlRow title="Nickname" :desc="card.nickname">
        <template v-if="canEdit" #action><ForenButton variant="outline" size="xxs" @click="emit('pick', 'nickname')">Change</ForenButton></template>
      </ControlRow>
      <ControlRow title="History" desc="Every change, who made it and when.">
        <template #action><ForenButton variant="outline" size="xxs" @click="emit('pick', 'history')">View</ForenButton></template>
      </ControlRow>
      <ControlRow v-if="canCancel && card.status === 'active'" title="Lock card" desc="Only an admin can unlock it.">
        <template #action><ForenButton variant="outline" size="xxs" @click="emit('pick', 'lock')">Lock</ForenButton></template>
      </ControlRow>
      <ControlRow v-if="canCancel" title="Cancel card" desc="Permanent. Subscriptions on it will fail.">
        <template #action><ForenButton variant="outline" size="xxs" destructive @click="emit('pick', 'cancel')">Cancel card</ForenButton></template>
      </ControlRow>
    </ControlGroup>
  </div>
</template>
