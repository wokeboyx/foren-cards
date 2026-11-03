<script setup lang="ts">
/** Mercury-style card panel: name and what's left today, the card, one row of actions with a More menu, then the key facts (limit with a pencil, type, billing address). Opens beside the card list and beside the card page. */
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from "reka-ui";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiFileList3Line,
  RiPencilLine,
  RiSnowflakeLine,
  RiTimeLine,
  RiWallet3Line,
} from "@/components/icons";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import CardArt from "@/components/card/CardArt.vue";
import { nameOnCard } from "@/components/card/holder";
import CardStatusBadge from "@/components/card/CardStatusBadge.vue";
import ForenProgress from "@/components/ui/ForenProgress.vue";
import { spentInPeriod } from "@/domain/authorize";
import { COPY } from "@/content/copy";
import { isExpiringSoon } from "@/domain/limits";
import { expiryLabel } from "@/components/create/card-form";
import { format } from "@/domain/money";
import type { Card } from "@/domain/types";
import { merchantById } from "@/fixtures/merchants";
import { unfreezeCard } from "@/services";
import { useAction } from "@/composables/useAction";
import { useNow } from "@/composables/useNow";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { personById, useAppStore } from "@/stores/app";
import { countdown, type DialogKind } from "./card-detail";
import CardStatusNote from "./CardStatusNote.vue";

const props = defineProps<{ card: Card; full?: boolean; closable?: boolean }>();
const emit = defineEmits<{ pick: [d: DialogKind]; close: [] }>();

const store = useAppStore();
const now = useNow(1000);
const unfreeze = useAction(unfreezeCard);
const expiringSoon = computed(() => isExpiringSoon(props.card, now.value));
const canFund = computed(
  () =>
    can(store.role, "edit", props.card) &&
    props.card.status !== "canceled" &&
    props.card.kind !== "emergency",
);
const canCancel = computed(
  () =>
    can(store.role, "cancel", props.card) && props.card.status !== "canceled",
);
const canceled = computed(() => props.card.status === "canceled");
const frozen = computed(() => props.card.status === "frozen");
const emergencyLeft = computed(() =>
  props.card.validUntil
    ? new Date(props.card.validUntil).getTime() - now.value.getTime()
    : null,
);
const emergencyDead = computed(
  () =>
    props.card.kind === "emergency" &&
    ((emergencyLeft.value !== null && emergencyLeft.value <= 0) ||
      !!props.card.used),
);
const locked = computed(() =>
  props.card.lockedMerchantId
    ? merchantById(props.card.lockedMerchantId)
    : undefined,
);
const canUnfreeze = computed(() => can(store.role, "unfreeze", props.card));

const amountText = computed(() => {
  const s = format(props.card.balance);
  const dot = s.lastIndexOf(".");
  return dot > 0
    ? { whole: s.slice(0, dot), cents: s.slice(dot) }
    : { whole: s, cents: "" };
});

const freezeLabel = computed(() =>
  !frozen.value ? "Freeze" : canUnfreeze.value ? "Unfreeze" : "Frozen",
);
const freezeDisabled = computed(
  () =>
    unfreeze.pending.value ||
    emergencyDead.value ||
    (!frozen.value && !can(store.role, "freeze", props.card)) ||
    (frozen.value && !canUnfreeze.value),
);

async function toggleFreeze() {
  if (!frozen.value)
    emit("pick", "freeze"); // asks first, in a dialog
  else if (canUnfreeze.value) {
    if ((await unfreeze.run(props.card.id)).ok) toast("Card unfrozen");
  } else emit("pick", "request-unfreeze");
}

const menu = ref(false);
const spent = computed(() =>
  spentInPeriod(props.card, store.transactions, now.value),
);
const left = computed(() => ({
  minor: Math.max(0, props.card.limit.daily.minor - spent.value.minor),
  currency: props.card.limit.daily.currency,
}));
const used = computed(() =>
  Math.min(1, spent.value.minor / props.card.limit.daily.minor),
);
const canEditLimit = computed(
  () =>
    can(store.role, "edit", props.card) &&
    !canceled.value &&
    props.card.kind !== "emergency",
);
const canRename = computed(
  () => can(store.role, "edit", props.card) && !canceled.value,
);
const holder = computed(() => personById(props.card.holderId));
const pick = (d: DialogKind) => {
  menu.value = false;
  emit("pick", d);
};
const item =
  "flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-focus [&_svg]:size-4 [&_svg]:text-fg-3";
</script>

<template>
  <section
    class="rounded-[16px] border border-line bg-surface p-5"
    aria-label="Card summary"
  >
    <!-- Beside the list the panel says which card it is; on the card page the page header already does -->
    <div v-if="!full" class="mb-4 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h2 class="truncate text-[15px] leading-[22px] font-semibold text-fg">
            {{ card.nickname }}
          </h2>
          <CardStatusBadge
            v-if="card.status !== 'active' || card.kind === 'emergency'"
            :card="card"
            size="sm"
          />
        </div>
        <p class="truncate text-[13px] text-fg-3">
          {{ card.companyCard ? "Company card" : holder?.name }} · ••
          {{ card.last4 }}
        </p>
      </div>
      <button
        v-if="closable"
        type="button"
        aria-label="Close card summary"
        class="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-fg-3 outline-none hover:bg-subtle hover:text-fg focus-visible:ring-2 focus-visible:ring-focus"
        @click="emit('close')"
      >
        <RiCloseLine class="size-[18px]" aria-hidden="true" />
      </button>
    </div>

    <!-- One note at a time, the most urgent first -->
    <div class="mb-4 empty:hidden">
      <CardStatusNote v-if="canceled" tone="error"
        >This card has been terminated. It can’t be used or reactivated.{{
          card.archived ? " It’s in Archived." : ""
        }}</CardStatusNote
      >
      <CardStatusNote v-else-if="frozen" tone="info">
        <template #icon><RiSnowflakeLine /></template>
        {{ COPY.cardFrozen }}
      </CardStatusNote>
      <CardStatusNote
        v-else-if="card.kind === 'emergency'"
        :tone="emergencyDead ? 'error' : 'warning'"
      >
        <template #icon><RiTimeLine /></template>
        {{
          emergencyDead
            ? "This emergency card is no longer usable."
            : `Single use at ${locked?.name}. Valid for ${countdown(emergencyLeft!)} more.`
        }}
      </CardStatusNote>
      <CardStatusNote v-else-if="card.balance.minor <= 0" tone="warning">
        <template #icon><RiWallet3Line /></template>
        {{
          canFund
            ? "This card has no balance, so payments will be declined."
            : "This card has no balance. Request a top-up from the account owner."
        }}
      </CardStatusNote>
      <CardStatusNote v-else-if="expiringSoon" tone="warning">
        <template #icon><RiTimeLine /></template>
        Expires {{ expiryLabel(card.expiry) }}.
        <button
          type="button"
          class="font-semibold underline outline-none focus-visible:ring-2 focus-visible:ring-focus"
          @click="emit('pick', 'expiring')"
        >
          Replace it
        </button>
      </CardStatusNote>
    </div>

    <!-- The card, with its balance on the face -->
    <CardArt
      :card="card"
      size="md"
      class="w-full"
      :holder-name="nameOnCard(card)"
      :merchant-name="card.kind === 'emergency' ? locked?.name : undefined"
      :balance="amountText"
      :class="cn(canceled && 'opacity-60 saturate-50')"
    />

    <!-- The limit, once: what's left of today's allowance, with the pencil to change it -->
    <div v-if="!canceled" class="mt-4">
      <div class="flex items-center justify-between gap-3">
        <p class="tnum text-[14px] text-fg-3" data-testid="left-today">
          <span class="text-[17px] font-semibold text-fg">{{
            format(left)
          }}</span>
          left of {{ format(card.limit.daily) }} today
        </p>
      </div>
      <ForenProgress
        size="sm"
        class="mt-2.5"
        :value="used * 100"
        hide-value
        :aria-label="`${format(spent)} of ${format(card.limit.daily)} spent today`"
        :fill-color="used >= 0.9 ? 'var(--color-foren-warning)' : undefined"
      />
    </div>

    <!-- Actions: one row, with the rest under More -->
    <div class="mt-4 flex items-center gap-0.5">
      <ForenButton v-if="canFund" size="xs" @click="emit('pick', 'fund')">
        <template #leadingIcon><RiAddLine /></template>
        Fund card
      </ForenButton>
      <ForenButton
        v-if="!canceled"
        size="xs"
        variant="ghost"
        :disabled="freezeDisabled"
        @click="toggleFreeze"
      >
        <template v-if="!frozen" #leadingIcon><RiSnowflakeLine /></template>
        {{ freezeLabel }}
      </ForenButton>
      <PopoverRoot v-if="canRename || canCancel || full" v-model:open="menu">
        <PopoverTrigger as-child>
          <ForenButton size="xs" variant="ghost" class="ml-auto">
            More
            <template #trailingIcon><RiArrowDownSLine /></template>
          </ForenButton>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            align="end"
            :side-offset="6"
            class="z-50 w-[210px] rounded-[14px] bg-surface p-1.5 shadow-[var(--shadow-foren-xl)] ring-1 ring-line outline-none"
          >
            <button
              v-if="canRename"
              type="button"
              :class="cn(item, 'text-fg hover:bg-subtle')"
              @click="pick('nickname')"
            >
              <RiPencilLine aria-hidden="true" />Edit nickname
            </button>
            <button
              v-if="canEditLimit"
              type="button"
              :class="cn(item, 'text-fg hover:bg-subtle')"
              @click="pick('limit')"
            >
              <RiPencilLine aria-hidden="true" />Edit limit
            </button>
            <button
              type="button"
              :class="cn(item, 'text-fg hover:bg-subtle')"
              @click="pick('history')"
            >
              <RiFileList3Line aria-hidden="true" />Change log
            </button>
            <div v-if="canCancel" class="my-1 h-px bg-line" />
            <button
              v-if="canCancel"
              type="button"
              :class="
                cn(item, 'text-error hover:bg-error-subtle [&_svg]:text-error')
              "
              @click="pick('cancel')"
            >
              <RiCloseCircleLine aria-hidden="true" />Terminate card
            </button>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </div>

    <RouterLink
      v-if="!full"
      :to="`/cards/${card.id}`"
      class="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-fg underline-offset-2 outline-none hover:underline focus-visible:underline"
    >
      All card details and activity
      <RiArrowRightSLine class="size-4" aria-hidden="true" />
    </RouterLink>
  </section>
</template>
