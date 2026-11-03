<script setup lang="ts">
import { limitSummary } from "@/domain/limits";
// Payments happen at the merchant's checkout, not in Foren, so moving a merchant to its own card needs the
// customer to update their card with that merchant.

/**
 * Guided move of one merchant off a shared card:
 * 1. create a card only this merchant can charge → 2. update your card with the merchant (off-app)
 * → Foren blocks the merchant on the old card once it charges the new one.
 */
import { computed, ref } from "vue";
import { RiCheckLine, RiLockLine, RiStore2Line } from "@/components/icons";
import ForenButton from "@/components/ui/ForenButton.vue";
import ForenToggle from "@/components/ui/ForenToggle.vue";
import CardArt from "@/components/card/CardArt.vue";
import Modal from "@/components/Modal.vue";
import type { Card, Merchant } from "@/domain/types";
import { giveMerchantOwnCard } from "@/services";
import { useAction } from "@/composables/useAction";
import { cn } from "@/lib/utils";
import { personById } from "@/stores/app";
import UpdateAtMerchant from "./UpdateAtMerchant.vue";

const props = defineProps<{ card: Card; merchant: Merchant }>();
const emit = defineEmits<{ close: [] }>();

const step = ref<1 | 2>(1);
const blockOld = ref(true);
const created = ref<Card | null>(null);
const create = useAction(giveMerchantOwnCard);
const holder = computed(() => personById(props.card.holderId));
const preview = computed<Card>(
  () =>
    created.value ?? {
      ...props.card,
      nickname: props.merchant.name,
      last4: "••••",
    },
);
const limitNote = computed(() =>
  props.card.limit.daily.minor < 1_000_000_000
    ? ` (${limitSummary(props.card.limit)})`
    : "",
);
const STEPS = ["Create the card", "Update it at the merchant"];

async function submit() {
  const r = await create.run(props.card.id, props.merchant.id, blockOld.value);
  if (r.ok) {
    created.value = r.value;
    step.value = 2;
  }
}
</script>

<template>
  <Modal
    :open="true"
    :title="
      step === 1
        ? `Give ${merchant.name} its own card`
        : `Update your card at ${merchant.name}`
    "
    class="max-w-[480px]"
    @update:open="(o) => !o && emit('close')"
  >
    <ol
      class="-mt-2 mb-4 flex items-center gap-2 text-[12px] font-medium"
      aria-label="Steps"
    >
      <li
        v-for="(label, i) in STEPS"
        :key="label"
        :class="
          cn(
            'flex items-center gap-2',
            i + 1 === step ? 'text-fg' : 'text-fg-3',
          )
        "
        :aria-current="i + 1 === step ? 'step' : undefined"
      >
        <span
          :class="
            cn(
              'tnum grid size-5 place-items-center rounded-full text-[11px]',
              i + 1 < step
                ? 'bg-success text-white'
                : i + 1 === step
                  ? 'bg-[var(--color-foren-bg-button-primary)] text-[var(--color-foren-text-inverse)]'
                  : 'bg-subtle',
            )
          "
        >
          <RiCheckLine v-if="i + 1 < step" class="size-3" aria-hidden="true" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        {{ label }}
        <span v-if="i === 0" class="h-px w-6 bg-line-2" aria-hidden="true" />
      </li>
    </ol>
    <div v-if="step === 1" class="space-y-4">
      <div class="flex justify-center rounded-[16px] bg-subtle py-5">
        <CardArt
          :card="preview"
          size="md"
          :merchant-name="merchant.name"
          :holder-name="holder?.name"
        />
      </div>
      <ul class="space-y-2 text-[14px] leading-[20px] text-fg">
        <li
          class="flex gap-2.5 [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-fg-2"
        >
          <RiLockLine />
          <span
            >Only {{ merchant.name }} can charge it. Every other merchant is
            declined.</span
          >
        </li>
        <li
          class="flex gap-2.5 [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-fg-2"
        >
          <RiStore2Line />
          <span
            >Same cardholder and limits as {{ card.nickname }}{{ limitNote }}.
            You can change them later.</span
          >
        </li>
      </ul>
      <ForenToggle
        v-model="blockOld"
        reverse
        class="w-full justify-between rounded-[16px] bg-subtle p-3.5"
        :label="`Block ${merchant.name} on ${card.nickname} once it switches`"
        :description="`When ${merchant.name} first charges its new card, we’ll stop it charging ${card.nickname}.`"
      />
      <p
        v-if="create.error.value"
        role="alert"
        class="rounded-[12px] bg-error-subtle px-3 py-2 text-[13px] text-error"
      >
        We couldn’t create the card. Nothing was changed. Try again.
      </p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ForenButton variant="secondary" size="sm" @click="emit('close')"
          >Not now</ForenButton
        >
        <ForenButton size="sm" :disabled="create.pending.value" @click="submit">
          {{
            create.pending.value ? "Creating…" : `Create ${merchant.name} card`
          }}
        </ForenButton>
      </div>
    </div>
    <UpdateAtMerchant
      v-else-if="created"
      :card="created"
      :merchant="merchant"
      :old-card="card"
      :block-old="blockOld"
      @done="emit('close')"
    />
  </Modal>
</template>
