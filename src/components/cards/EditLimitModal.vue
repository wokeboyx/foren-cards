<script setup lang="ts">
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenCheckbox from "@/components/ui/ForenCheckbox.vue";
import ForenInput from "@/components/ui/ForenInput.vue";
import Modal from "@/components/Modal.vue";
import { POLICY } from "@/config/policy";
import { COPY } from "@/content/copy";
import { PERIOD_LABEL, PERIOD_PHRASE } from "@/domain/labels";
import { format, parseAmount } from "@/domain/money";
import type { Card, LimitPeriod } from "@/domain/types";
import { setCardLimit } from "@/services";
import { useAction } from "@/composables/useAction";
import { now as clockNow } from "@/stores/app";

const props = defineProps<{ card: Card }>();
const emit = defineEmits<{ close: [] }>();

const period = ref<LimitPeriod>(props.card.limit.period);
const amount = ref(String(props.card.limit.amount.minor / 100));
const temporary = ref(false);
const days = ref(7);
const error = ref<string | null>(null);
const save = useAction(setCardLimit);
const cur = props.card.limit.amount.currency;
const parsed = computed(() => parseAmount(amount.value, cur));
const changed = computed(() => period.value !== props.card.limit.period || parsed.value?.minor !== props.card.limit.amount.minor);
const periods = Object.keys(PERIOD_LABEL) as LimitPeriod[];

async function submit() {
  const max = POLICY.maxLimitMajor[cur];
  const p = parsed.value;
  if (!p) return (error.value = "Enter an amount using numbers only, like 2,500.00.");
  if (p.minor <= 0) return (error.value = "The limit must be more than zero.");
  if (p.minor > max * 100) return (error.value = `The most you can set is ${format({ minor: max * 100, currency: cur })}.`);
  error.value = null;
  const until = temporary.value ? new Date(clockNow().getTime() + days.value * 86_400_000).toISOString() : undefined;
  if ((await save.run(props.card.id, { period: period.value, amount: p }, until)).ok) {
    toast(temporary.value ? `Limit changed for ${days.value} ${days.value === 1 ? "day" : "days"}` : "Limit saved");
    emit("close");
  }
}
</script>

<template>
  <Modal :open="true" title="Edit card limit" @update:open="(o) => !o && emit('close')">
    <div class="space-y-4">
      <div class="flex flex-col gap-2">
        <label for="lim-type" class="text-[14px] font-medium text-fg">Limit type</label>
        <select id="lim-type" v-model="period" class="h-12 rounded-[16px] bg-subtle px-3 text-[14px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
          <option v-for="p in periods" :key="p" :value="p">{{ PERIOD_LABEL[p] }}</option>
        </select>
      </div>
      <ForenInput
        v-model="amount"
        label="Spend limit"
        inputmode="decimal"
        class="tnum"
        :error="error ?? undefined"
        :description="!error && parsed && parsed.minor > 0 ? `Up to ${format(parsed)} ${PERIOD_PHRASE[period]}.` : undefined"
      >
        <template #leadingIcon><span class="text-[14px] font-medium text-fg-2">{{ cur }}</span></template>
      </ForenInput>
      <div>
        <ForenCheckbox
          :model-value="temporary"
          label="This is a temporary change"
          description="Automatically restore the current limit after a period of time."
          @update:model-value="(v) => (temporary = v === true)"
        />
        <div v-if="temporary" class="mt-3 flex items-center gap-2 pl-8 text-[13px] text-fg-2">
          <label for="lim-days">Restore after</label>
          <select id="lim-days" v-model.number="days" class="h-9 rounded-full bg-subtle px-3 text-[13px] font-medium text-fg outline-none focus:ring-2 focus:ring-focus">
            <option :value="1">1 day</option>
            <option :value="7">7 days</option>
            <option :value="30">30 days</option>
          </select>
        </div>
      </div>
      <p v-if="save.error.value" role="alert" class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error">{{ COPY.saveFailure }}</p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="secondary" size="sm" @click="emit('close')">Cancel</ForenButton>
        <ForenButton size="sm" :disabled="!changed || !parsed || parsed.minor <= 0 || save.pending.value" @click="submit">
          {{ save.pending.value ? "Saving…" : "Save limit" }}
        </ForenButton>
      </div>
    </div>
  </Modal>
</template>
