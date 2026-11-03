<script setup lang="ts">
// "See it before you commit to it." (website Figma 3011:4362), plus a daily rate on WhatsApp.
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import { RiArrowUpDownLine } from "@/components/icons";
import { asset } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { formatAmount, rate } from "./data";
import AmountRow from "./AmountRow.vue";
import DailyRate from "./DailyRate.vue";
import GlassCard from "./GlassCard.vue";
import Intro from "./Intro.vue";
import Panel from "./Panel.vue";
import RateBadge from "./RateBadge.vue";
import RateRow from "./RateRow.vue";
import { ink, primaryBtn } from "./shared";

const from = ref("NGN");
const to = ref("USD");
const amount = ref("200,000");

const send = computed(() => Number(amount.value.replace(/,/g, "")) || 0);
const receive = computed(() => send.value * rate(from.value, to.value));
// Quote the rate the way the website does: 1 unit of the stronger currency.
const pair = computed(() =>
  rate(from.value, to.value) < 1
    ? [to.value, from.value]
    : [from.value, to.value],
);

// Picking the other side's currency swaps the two.
function pick(side: "from" | "to", v: string) {
  if (side === "from") {
    if (v === to.value) to.value = from.value;
    from.value = v;
  } else {
    if (v === from.value) from.value = to.value;
    to.value = v;
  }
}
function swap() {
  [from.value, to.value] = [to.value, from.value];
}
function onAmount(e: Event) {
  const el = e.target as HTMLInputElement;
  el.value = el.value.replace(/[^\d.,]/g, "");
  amount.value = el.value;
}
function onBlur() {
  if (send.value)
    amount.value = send.value.toLocaleString("en-GB", {
      maximumFractionDigits: 2,
    });
}
</script>

<template>
  <div class="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
    <Intro description="The rate you see is the rate you get. Every time">
      <template #title>See it before<br />you commit to it.</template>
      <DailyRate />
    </Intro>

    <div class="relative">
      <img
        :src="asset('/website/dollar-coin.png')"
        alt=""
        width="320"
        height="320"
        class="pointer-events-none absolute -right-28 -bottom-24 hidden size-[320px] select-none sm:block"
      />
      <GlassCard>
        <div class="relative flex flex-col gap-4">
          <AmountRow
            label="You send"
            :currency="from"
            @update:currency="(v: string) => pick('from', v)"
          >
            <input
              aria-label="Amount you send"
              inputmode="decimal"
              :value="amount"
              :class="
                cn(
                  'w-full bg-transparent text-right text-[30px] leading-[36px] font-semibold tracking-[-0.75px] outline-none',
                  ink,
                )
              "
              @input="onAmount"
              @blur="onBlur"
            />
          </AmountRow>
          <button
            type="button"
            aria-label="Swap currencies"
            class="absolute top-[76px] left-1/2 z-10 grid size-10 -translate-x-1/2 place-items-center rounded-full border border-[rgba(198,178,187,0.3)] bg-white text-[#2f2d2b] shadow-sm outline-none hover:bg-[#fafaf9] focus-visible:ring-2 focus-visible:ring-[#2f2d2b]/30"
            @click="swap"
          >
            <RiArrowUpDownLine class="size-5" aria-hidden="true" />
          </button>
          <AmountRow
            label="They receive"
            :currency="to"
            @update:currency="(v: string) => pick('to', v)"
          >
            <p
              :class="
                cn(
                  'text-right text-[30px] leading-[36px] font-semibold tracking-[-0.75px]',
                  ink,
                )
              "
              aria-live="polite"
            >
              {{ formatAmount(receive) }}
            </p>
          </AmountRow>
          <Panel class="flex flex-col gap-4 p-6">
            <RateRow label="Exchange rate">
              <span :class="cn('text-[14px]', ink)"
                >1 {{ pair[0] }} ≈ {{ formatAmount(rate(pair[0], pair[1])) }}
                {{ pair[1] }}</span
              >
            </RateRow>
            <RateRow label="Our fee">
              <RateBadge icon="/website/confetti.svg">Free</RateBadge>
            </RateRow>
            <RateRow label="Arrives">
              <RateBadge icon="/website/lightning.svg">Instantly</RateBadge>
            </RateRow>
          </Panel>
        </div>
        <RouterLink to="/onboarding" :class="cn(primaryBtn, 'mt-8 w-full')"
          >Send money</RouterLink
        >
      </GlassCard>
    </div>
  </div>
</template>
