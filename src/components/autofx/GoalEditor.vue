<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import ChoiceCard from "@/components/create/ChoiceCard.vue";
import Modal from "@/components/Modal.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import { useAction } from "@/composables/useAction";
import { goalSentence } from "@/domain/autofx";
import { formatRate, parseAmount, rate } from "@/domain/money";
import type { AutoFxGoal, Currency, GoalType } from "@/domain/types";
import { call } from "@/services/mock/call";
import { now, uid, useAppStore } from "@/stores/app";
import CurrencyField from "./CurrencyField.vue";
import { GOAL_TYPE_IDS, GOAL_TYPES } from "./global-account";

const props = defineProps<{ open: boolean; initialType: GoalType | null }>();
const emit = defineEmits<{ "update:open": [open: boolean] }>();
const store = useAppStore();

const type = ref<GoalType | null>(props.initialType);
const currency = ref<Currency>("GBP");
const counter = ref<Currency>("USD");
const amount = ref("");
const targetRate = ref("");
const errors = ref<Record<string, string>>({});
const save = useAction(async (g: AutoFxGoal) => call(() => store.addGoal(g)));

watch(
  () => [props.open, props.initialType] as const,
  ([open, initialType]) => {
    if (!open) return;
    type.value = initialType;
    errors.value = {};
    amount.value = "";
    targetRate.value = "";
    if (initialType === "target_rate") {
      currency.value = "USD";
      counter.value = "NGN";
    } else {
      currency.value = initialType === "cap" ? "CAD" : "GBP";
      counter.value = "USD";
    }
  },
  { immediate: true },
);

const amt = computed(() => parseAmount(amount.value, currency.value));
const tr = computed(() => Number(targetRate.value.replace(/,/g, "")));
const draft = computed(() => {
  const t = type.value;
  if (!t) return null;
  const a = amt.value;
  return {
    type: t,
    currency: currency.value,
    counterCurrency: counter.value,
    threshold: t !== "target_rate" && a && a.minor > 0 ? a : undefined,
    amount: t === "target_rate" && a && a.minor > 0 ? a : undefined,
    targetRate: t === "target_rate" && tr.value > 0 ? tr.value : undefined,
  };
});

async function submit() {
  const e: Record<string, string> = {};
  if (!amount.value.trim()) e.amount = "Enter an amount.";
  else if (!amt.value || amt.value.minor <= 0)
    e.amount = "Enter an amount above zero, using numbers only.";
  if (currency.value === counter.value)
    e.counter = "Choose a different currency.";
  if (type.value === "target_rate" && !(tr.value > 0))
    e.rate = "Enter a target rate above zero.";
  errors.value = e;
  if (Object.keys(e).length || !draft.value) return;
  const r = await save.run({
    ...draft.value,
    id: uid("g"),
    createdAt: now().toISOString(),
    actions: [],
  } as AutoFxGoal);
  if (r.ok) {
    toast("Goal saved. Nothing has been converted yet.");
    emit("update:open", false);
  }
}
</script>

<template>
  <Modal
    :open="open"
    :title="type ? GOAL_TYPES[type].title : 'New currency goal'"
    class="sm:max-w-[520px]"
    @update:open="(o) => emit('update:open', o)"
  >
    <div v-if="!type" role="radiogroup" class="grid gap-2">
      <ChoiceCard
        v-for="t in GOAL_TYPE_IDS"
        :key="t"
        name="goal-type"
        :value="t"
        :checked="false"
        :title="GOAL_TYPES[t].title"
        :description="GOAL_TYPES[t].line"
        @change="type = t"
      >
        <template #icon><component :is="GOAL_TYPES[t].icon" /></template>
      </ChoiceCard>
    </div>
    <div v-else class="space-y-4">
      <template v-if="type === 'keep_min'">
        <CurrencyField
          id="g-cur"
          v-model="currency"
          label="Currency to protect"
        />
        <ForenInput
          v-model="amount"
          :label="`Minimum ${currency} balance`"
          inputmode="decimal"
          :error="errors.amount"
          class="tnum"
        />
        <CurrencyField
          id="g-counter"
          v-model="counter"
          label="Top up from"
          :error="errors.counter"
        />
      </template>
      <template v-if="type === 'target_rate'">
        <div class="grid grid-cols-2 gap-3">
          <CurrencyField id="g-cur" v-model="currency" label="Convert from" />
          <CurrencyField
            id="g-counter"
            v-model="counter"
            label="Convert to"
            :error="errors.counter"
          />
        </div>
        <ForenInput
          v-model="amount"
          :label="`Amount of ${currency} to convert`"
          inputmode="decimal"
          :error="errors.amount"
          class="tnum"
        />
        <ForenInput
          v-model="targetRate"
          :label="`Target rate (${counter} per 1 ${currency})`"
          inputmode="decimal"
          :error="errors.rate"
          class="tnum"
          :description="
            currency !== counter
              ? `Today: ${formatRate(currency, counter, rate(currency, counter))}`
              : undefined
          "
        />
      </template>
      <template v-if="type === 'cap'">
        <CurrencyField id="g-cur" v-model="currency" label="Currency to cap" />
        <ForenInput
          v-model="amount"
          :label="`Maximum ${currency} balance`"
          inputmode="decimal"
          :error="errors.amount"
          class="tnum"
        />
        <CurrencyField
          id="g-counter"
          v-model="counter"
          label="Move the excess to"
          :error="errors.counter"
        />
      </template>
      <div v-if="draft" class="rounded-[16px] bg-primary-subtle px-4 py-3">
        <div
          class="text-[12px] font-semibold tracking-[0.06em] text-fg-3 uppercase"
        >
          Your goal
        </div>
        <p class="mt-1 text-[15px] leading-[22px] font-semibold text-fg">
          {{ goalSentence(draft) }}
        </p>
        <p class="mt-1 text-[12px] text-fg-2">
          Saving doesn’t convert anything now. Foren acts only when the rule is
          met, at the rate at that time, with the usual FX fee.
        </p>
      </div>
      <p
        v-if="save.error.value"
        role="alert"
        class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error"
      >
        We couldn’t save this goal. Try again.
      </p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <ForenButton variant="ghost" size="sm" @click="type = null"
          >Change goal type</ForenButton
        >
        <ForenButton
          size="sm"
          :disabled="save.pending.value || !draft"
          @click="submit"
          >{{ save.pending.value ? "Saving…" : "Save goal" }}</ForenButton
        >
      </div>
    </div>
  </Modal>
</template>
