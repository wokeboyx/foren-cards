<script setup lang="ts">
/** Success: the card, what was set up and what it cost, and the next step. A new card has no balance, so funding it comes first. */
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { RiAddLine, RiWallet3Line } from "@/components/icons";
import FocusFrame from "./FocusFrame.vue";
import SuccessCheck from "@/components/SuccessCheck.vue";
import SuccessGlow from "@/components/SuccessGlow.vue";
import ForenButton from "@/components/ui/ForenButton.vue";
import FundCardModal from "@/components/cards/FundCardModal.vue";
import { POLICY } from "@/config/policy";
import { COPY } from "@/content/copy";
import { limitSummary } from "@/domain/limits";
import { convert, format } from "@/domain/money";
import type { Card, Currency } from "@/domain/types";
import { COMPANY } from "@/fixtures/seed";
import { personById, useAppStore } from "@/stores/app";
import { expiryLabel } from "./card-form";

const props = defineProps<{ cards: Card[]; feeFrom?: Currency }>();
const emit = defineEmits<{ another: [] }>();

const store = useAppStore();
const router = useRouter();
const many = computed(() => props.cards.length > 1);
const card = computed(() => props.cards[0]);
const live = computed(
  () => store.cards.find((c) => c.id === card.value.id) ?? card.value,
);
const holder = computed(() => personById(card.value.holderId));
const funded = computed(() => live.value.balance.minor > 0);
const fee = computed(() => {
  const one = convert(
    POLICY.cardCreationFee,
    props.feeFrom ?? POLICY.cardCreationFee.currency,
  );
  return { ...one, minor: one.minor * props.cards.length };
});
const funding = ref(false);
const heading = useTemplateRef<HTMLHeadingElement>("heading");
onMounted(() => heading.value?.focus());

const rows = computed(() => [
  {
    label: many.value ? "Cards" : "Nickname",
    value: props.cards.map((c) => c.nickname).join(", "),
  },
  {
    label: "For",
    value: card.value.companyCard ? COMPANY.name : (holder.value?.name ?? "—"),
  },
  { label: "Spending limits", value: limitSummary(card.value.limit) },
  { label: "Expires", value: expiryLabel(card.value.expiry) },
  {
    label: "Creation fee paid",
    value: `${format(fee.value)} from your ${fee.value.currency} balance`,
  },
]);
</script>

<template>
  <!-- Figma success page: the grey panel, everything centred, one column of stacked buttons -->
  <FocusFrame center @close="router.push('/cards')">
    <SuccessGlow />
    <div class="flex w-full max-w-[456px] flex-col items-center text-center">
      <SuccessCheck :size="100" />
      <h1
        ref="heading"
        class="mt-6 font-display text-[20px] leading-[30px] font-semibold tracking-[-0.3px] [font-synthesis:none] text-fg"
        tabindex="-1"
      >
        {{ many ? `${cards.length} cards created` : COPY.successTitle }}
      </h1>
      <p
        class="mt-2 max-w-sm text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg-2"
      >
        {{
          many
            ? "Each has its own number and the same settings."
            : COPY.successBody
        }}
      </p>
      <p
        v-if="holder?.invited && !card.companyCard"
        class="mt-3 max-w-sm rounded-[14px] bg-surface px-4 py-2.5 text-[13px] leading-[18px] text-fg-2 ring-1 ring-line"
      >
        We’ve emailed {{ holder?.name }} an invite. They can use this card once
        they’ve joined Foren.
      </p>

      <dl
        class="mt-8 w-full divide-y divide-line rounded-[20px] bg-surface px-4 text-left text-[13px] ring-1 ring-line"
      >
        <div
          v-for="r in rows"
          :key="r.label"
          class="flex items-start justify-between gap-4 py-2.5"
        >
          <dt class="text-fg-3">{{ r.label }}</dt>
          <dd class="text-right font-medium text-fg">{{ r.value }}</dd>
        </div>
      </dl>

      <!-- A card only spends what's on it, so the next step is funding it. -->
      <section
        aria-label="Fund your card"
        class="mt-4 flex w-full items-center gap-3 rounded-[20px] bg-surface p-4 text-left ring-1 ring-line"
      >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-fg-2"
          ><RiWallet3Line class="size-5" aria-hidden="true"
        /></span>
        <p class="text-[13px] leading-[19px] text-fg-2">
          <template v-if="many"
            >These cards have no balance yet. Fund each one from its card page
            to spend on it.</template
          >
          <template v-else-if="funded"
            >Balance:
            <span class="font-semibold text-fg">{{ format(live.balance) }}</span
            >. Add more any time.</template
          >
          <template v-else
            >This card has no balance yet. Fund it to start spending: payments
            are declined until you do.</template
          >
        </p>
      </section>

      <!-- Figma "Sent" page: three equal buttons across the column, outline, outline with an icon, then the dark main step -->
      <div class="mt-8 flex w-full gap-3">
        <ForenButton
          variant="outline"
          size="sm"
          class="min-w-0 flex-1 px-3"
          @click="router.push(many ? '/cards' : `/cards/${card.id}`)"
          >{{ many ? "View cards" : "View card details" }}</ForenButton
        >
        <ForenButton
          variant="outline"
          size="sm"
          class="min-w-0 flex-1 px-3"
          @click="emit('another')"
        >
          Create another
        </ForenButton>
        <ForenButton
          v-if="!many"
          size="sm"
          class="min-w-0 flex-1 px-3"
          @click="funding = true"
        >
          <template #leadingIcon><RiAddLine /></template>
          Fund card
        </ForenButton>
      </div>
    </div>

    <FundCardModal v-if="funding" :card="live" @close="funding = false" />
  </FocusFrame>
</template>
