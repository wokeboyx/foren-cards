<script setup lang="ts">
import { computed } from "vue";
import { RiFileList3Line, RiLockLine, RiLockUnlockLine, RiPlaneLine, RiSnowflakeLine, RiTimeLine } from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenProgress from "@/components/ui/ForenProgress.vue";
import LinkButton from "@/components/LinkButton.vue";
import Money from "@/components/Money.vue";
import { COPY } from "@/content/copy";
import { spentInPeriod } from "@/domain/authorize";
import { PERIOD_NOUN, PERIOD_PHRASE } from "@/domain/labels";
import { format } from "@/domain/money";
import type { Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { freezeCard, unfreezeCard } from "@/services";
import { useAction } from "@/composables/useAction";
import { useNow } from "@/composables/useNow";
import { can } from "@/lib/permissions";
import { requestState, useAppStore } from "@/stores/app";
import { countdown, timeAgo, type DialogKind } from "./card-detail";
import CardStatusNote from "./CardStatusNote.vue";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ pick: [d: DialogKind] }>();

const store = useAppStore();
const now = useNow(1000);
const freeze = useAction(freezeCard);
const unfreeze = useAction(unfreezeCard);

const perTxn = computed(() => props.card.limit.period === "per_txn");
const spent = computed(() =>
  spentInPeriod(perTxn.value ? { ...props.card, limit: { ...props.card.limit, period: "monthly" } } : props.card, store.transactions, now.value)
);
const pending = computed(() => store.transactions.filter((t) => t.cardId === props.card.id && t.status === "pending").reduce((s, t) => s + t.amount.minor, 0));
const left = computed(() => Math.max(0, props.card.limit.amount.minor - spent.value.minor - pending.value));
const ratio = computed(() => (perTxn.value ? 0 : Math.min(1, spent.value.minor / props.card.limit.amount.minor)));
const pendingUnfreeze = computed(() => store.requests.find((r) => r.kind === "unfreeze" && r.cardId === props.card.id && requestState(r, now.value) === "pending"));
const pendingLimit = computed(() => store.requests.find((r) => r.kind === "limit_increase" && r.cardId === props.card.id && requestState(r, now.value) === "pending"));
const canceled = computed(() => props.card.status === "canceled");
const frozen = computed(() => props.card.status === "frozen");
const emergencyLeft = computed(() => (props.card.validUntil ? new Date(props.card.validUntil).getTime() - now.value.getTime() : null));
const emergencyDead = computed(() => props.card.kind === "emergency" && ((emergencyLeft.value !== null && emergencyLeft.value <= 0) || !!props.card.used));
const locked = computed(() => (props.card.lockedMerchantId ? merchantById(props.card.lockedMerchantId) : undefined));
const canUnfreeze = computed(() => can(store.role, "unfreeze", props.card));

const amountText = computed(() => {
  const s = format(spent.value);
  const dot = s.lastIndexOf(".");
  return dot > 0 ? { whole: s.slice(0, dot), cents: s.slice(dot) } : { whole: s, cents: "" };
});

const freezeLabel = computed(() =>
  !frozen.value
    ? "Freeze"
    : props.card.adminLock
      ? canUnfreeze.value
        ? "Unlock"
        : "Locked by an admin"
      : canUnfreeze.value
        ? "Unfreeze"
        : pendingUnfreeze.value
          ? "Unfreeze requested"
          : "Request unfreeze"
);
const freezeDisabled = computed(
  () =>
    freeze.pending.value ||
    unfreeze.pending.value ||
    emergencyDead.value ||
    (!frozen.value && !can(store.role, "freeze", props.card)) ||
    (frozen.value && !!props.card.adminLock && !canUnfreeze.value) ||
    (frozen.value && !!pendingUnfreeze.value)
);

async function toggleFreeze() {
  if (!frozen.value) {
    if ((await freeze.run(props.card.id)).ok) toast("Card frozen. Payments will fail until you unfreeze it.");
  } else if (props.card.adminLock) emit("pick", "unlock");
  else if (canUnfreeze.value) {
    if ((await unfreeze.run(props.card.id)).ok) toast("Card unfrozen");
  } else emit("pick", "request-unfreeze");
}
</script>

<template>
  <section class="rounded-[20px] bg-surface" aria-label="Spending">
    <div class="px-6 pt-4 pb-4">
      <div class="text-[14px] text-fg-2">{{ perTxn ? "Spent this month" : `Spent ${PERIOD_NOUN[card.limit.period]}` }}</div>
      <div class="tnum mt-0.5 text-[40px] leading-[54px] font-semibold tracking-[-0.02em] text-fg">
        {{ amountText.whole }}<span v-if="amountText.cents" class="text-[24px] text-fg-3">{{ amountText.cents }}</span>
      </div>
      <ForenProgress
        v-if="!perTxn && !canceled"
        size="sm"
        class="mt-3 max-w-[420px]"
        :value="ratio * 100"
        hide-value
        :aria-label="`${format(spent)} of ${format(card.limit.amount)} spent ${PERIOD_NOUN[card.limit.period]}`"
        :fill-color="ratio >= 0.9 ? 'var(--color-foren-warning)' : undefined"
      />
      <p class="tnum mt-2 text-[13px] text-fg-3">
        {{
          perTxn
            ? `Up to ${format(card.limit.amount)} per charge`
            : `${format({ minor: left, currency: card.limit.amount.currency })} left of ${format(card.limit.amount)} ${PERIOD_PHRASE[card.limit.period]}`
        }}{{ pending > 0 ? ` · ${format({ minor: pending, currency: card.limit.amount.currency })} pending` : "" }}
      </p>

      <div class="mt-4 space-y-2 empty:hidden">
        <CardStatusNote v-if="frozen && card.adminLock" tone="warning">
          <template #icon><RiLockLine /></template>
          <span class="font-semibold">Locked by {{ card.adminLock.by }}.</span> {{ card.adminLock.reason ? `“${card.adminLock.reason}” ` : "" }}No payments will go
          through, and only an account admin can unlock it.
        </CardStatusNote>
        <CardStatusNote v-if="frozen && !card.adminLock" tone="info">
          <template #icon><RiSnowflakeLine /></template>
          {{ COPY.cardFrozen }}
          <span v-if="pendingUnfreeze" class="block text-fg-2">Unfreeze requested {{ timeAgo(pendingUnfreeze.createdAt, now) }}. Waiting for the account owner.</span>
        </CardStatusNote>
        <CardStatusNote v-if="canceled" tone="error">This card has been canceled. It can’t be used or reactivated.{{ card.archived ? " It’s in Archived." : "" }}</CardStatusNote>
        <CardStatusNote v-if="card.kind === 'emergency'" :tone="emergencyDead ? 'error' : 'warning'">
          <template #icon><RiTimeLine /></template>
          {{ emergencyDead ? "This emergency card is no longer usable." : `Single use at ${locked?.name}. Valid for ${countdown(emergencyLeft!)} more.` }}
        </CardStatusNote>
        <CardStatusNote v-if="pendingLimit" tone="neutral">
          Limit increase to <Money :value="pendingLimit.newLimit!.amount" /> requested {{ timeAgo(pendingLimit.createdAt, now) }}. Waiting for the account owner.
        </CardStatusNote>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 border-t border-line px-6 py-4 sm:flex sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
      <ForenButton v-if="!canceled" size="xxs" :variant="frozen ? 'primary' : 'outline'" :disabled="freezeDisabled" @click="toggleFreeze">
        <template v-if="!frozen || card.adminLock" #leadingIcon>
          <RiLockUnlockLine v-if="frozen" />
          <RiSnowflakeLine v-else />
        </template>
        {{ freezeLabel }}
      </ForenButton>
      <LinkButton :href="`/cards/${card.id}/transactions`" variant="outline" size="xxs">
        <template #leadingIcon><RiFileList3Line /></template>
        Transactions
      </LinkButton>
      <LinkButton v-if="!canceled" :href="`/travel?card=${card.id}`" variant="outline" size="xxs">
        <template #leadingIcon><RiPlaneLine /></template>
        Spending abroad
      </LinkButton>
      <ForenButton v-if="canceled && !card.archived && can(store.role, 'archive', card)" size="xxs" variant="outline" @click="emit('pick', 'archive')">Archive</ForenButton>
    </div>
  </section>
</template>
