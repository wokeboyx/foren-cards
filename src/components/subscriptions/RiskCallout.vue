<script setup lang="ts">
/** Warning before a subscription declines — names merchant, date, amount, cause and one fix (AC 8.5). */
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import MerchantLogo from "@/components/MerchantLogo.vue";
import Money from "@/components/Money.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import { COPY, DECLINE } from "@/content/copy";
import { convert, format } from "@/domain/money";
import { merchantById } from "@/fixtures/merchants";
import { can } from "@/lib/permissions";
import { allowNextAttempt, fundCard, unfreezeCard } from "@/services";
import { useAppStore } from "@/stores/app";
import { short, type SubRow } from "./subscriptions-page";

const props = defineProps<{ r: SubRow }>();
const emit = defineEmits<{ open: [] }>();
const store = useAppStore();
const busy = ref(false);

const m = computed(() => merchantById(props.r.s.merchantId)!);
const reason = computed(() =>
  props.r.st.kind === "at_risk" || props.r.st.kind === "declined"
    ? props.r.st.reason
    : "unknown",
);
const when = computed(() =>
  props.r.f.kind === "estimate"
    ? `around ${short(props.r.f.date)} (estimate)`
    : "next time it charges",
);
const amount = computed(() =>
  props.r.f.kind === "estimate" ? props.r.f.amount : props.r.s.usualAmount,
);
const owner = computed(() =>
  can(store.role, "manageSubscriptions", props.r.card),
);

const fix = computed<{ label: string; run: () => Promise<void> } | null>(() => {
  const r = props.r;
  const a = amount.value;
  if (!owner.value) return null;
  if (reason.value === "frozen")
    return { label: "Unfreeze card", run: () => unfreezeCard(r.card.id) };
  if (reason.value === "insufficient_balance")
    return {
      label: `Fund card with ${format(convert(a, r.card.balance.currency))}`,
      run: async () =>
        void (await fundCard(
          r.card.id,
          r.card.balance.currency,
          convert(a, r.card.balance.currency),
        )),
    };
  if (
    reason.value === "merchant_blocked" ||
    reason.value === "category_blocked" ||
    reason.value === "merchant_not_allowed"
  )
    return {
      label: "Allow next charge only",
      run: () => allowNextAttempt(r.s.id),
    };
  return null;
});

async function runFix() {
  if (!fix.value) return;
  busy.value = true;
  try {
    await fix.value.run();
    toast("Done — we’ll update the status once it’s confirmed.");
  } catch {
    toast.error(COPY.saveFailure);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <li class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
    <MerchantLogo :merchant="m" :size="28" />
    <p class="flex-1 text-[13px] leading-[18px] text-fg">
      <template v-if="r.st.kind === 'declined'">
        <span class="font-semibold"
          >The last {{ m.name }} charge was declined.</span
        >
        {{ DECLINE[reason].title }}{{ " " }}
      </template>
      <template v-else>
        <span class="font-semibold"
          >{{ m.name }} may decline {{ when }} for
          <Money :value="amount" />.</span
        >{{ " " }}{{ DECLINE[reason].title }}{{ " " }}
      </template>
      <template v-if="!fix">{{
        reason === "spend_limit" || reason === "per_charge_limit"
          ? "Review the card’s spending limit."
          : owner
            ? ""
            : DECLINE[reason].next
      }}</template>
    </p>
    <div class="flex shrink-0 gap-2">
      <ForenButton size="xxs" variant="ghost" @click="emit('open')"
        >Details</ForenButton
      >
      <ForenButton
        v-if="fix"
        size="xxs"
        variant="secondary"
        :disabled="busy"
        @click="runFix"
      >
        {{ busy ? "Working…" : fix.label }}
      </ForenButton>
    </div>
  </li>
</template>
