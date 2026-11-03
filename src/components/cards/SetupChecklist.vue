<script setup lang="ts">
/** First visit (AC 1.1): one clear way to start. Laid out like the Figma "Account Card" empty state: the card illustration on the left, title, one action and three features on the right. */
import { onBeforeUnmount, onMounted, ref, type Component } from "vue";
import CardTermsModal from "./CardTermsModal.vue";
import type { CardDesign } from "@/domain/types";
import { useReducedMotion } from "motion-v";
import {
  RiAddLine,
  RiGlobalLine,
  RiInformationLine,
  RiShieldCheckLine,
  RiSnowflakeLine,
} from "@/components/icons";
import CardArt from "@/components/card/CardArt.vue";
import LinkButton from "@/components/LinkButton.vue";
import { POLICY } from "@/config/policy";
import { format } from "@/domain/money";
import { COMPANY } from "@/fixtures/seed";
import { can } from "@/lib/permissions";
import { useAppStore } from "@/stores/app";

const FEATURES: { icon: Component; label: string }[] = [
  { icon: RiSnowflakeLine, label: "Freeze any time" },
  { icon: RiShieldCheckLine, label: "Daily limits" },
  { icon: RiGlobalLine, label: "Multi currency" },
];

/** The flip takes 4s; the colour changes while the card is edge-on (80% in). */
const SKINS: CardDesign[] = ["ink", "cobalt", "clay", "lime", "silver"];
const CYCLE_MS = 4000;
const skin = ref(0);
let swap: ReturnType<typeof setTimeout> | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
const reduce = useReducedMotion();
const fee = format(POLICY.cardCreationFee);
const terms = ref(false);
const store = useAppStore();
onMounted(() => {
  if (reduce.value) return;
  swap = setTimeout(() => {
    skin.value = (skin.value + 1) % SKINS.length;
    timer = setInterval(
      () => (skin.value = (skin.value + 1) % SKINS.length),
      CYCLE_MS,
    );
  }, CYCLE_MS * 0.8);
});
onBeforeUnmount(() => {
  clearTimeout(swap);
  clearInterval(timer);
});
const owner = can(store.role, "issue");
</script>

<template>
  <div v-if="!owner" class="rounded-[20px] bg-surface p-8 text-center">
    <h2 class="text-[20px] font-semibold text-fg">No cards yet</h2>
    <p class="mt-2 text-[14px] text-fg-2">
      Cards issued to you will appear here.
    </p>
    <LinkButton href="/cards/request" class="mt-5">Request a card</LinkButton>
  </div>

  <section
    v-else
    class="flex flex-col items-center gap-8 rounded-[24px] border-2 border-[#f7f7f7] bg-surface px-4 py-10 md:flex-row md:justify-between"
    aria-labelledby="cards-empty-title"
  >
    <!-- A card that flips over and comes back in another colour -->
    <div
      class="relative grid h-[280px] w-full max-w-[380px] shrink-0 place-items-center overflow-hidden rounded-[20px] bg-gradient-to-b from-canvas to-transparent"
      style="perspective: 900px"
      aria-hidden="true"
    >
      <span
        class="absolute top-1/2 left-1/2 size-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-subtle blur-2xl"
      />
      <div :class="['relative', !reduce && 'card-flip']">
        <CardArt
          :card="{
            design: SKINS[skin],
            nickname: 'Team travel',
            last4: '4821',
            kind: 'standard',
            status: 'active',
          }"
          size="md"
          :holder-name="COMPANY.name"
        />
      </div>
    </div>

    <div class="w-full max-w-[564px]">
      <div class="flex flex-col gap-3 pb-4">
        <div class="flex flex-col gap-1">
          <h2
            id="cards-empty-title"
            class="text-[14px] leading-[21px] font-medium tracking-[0.14px] text-fg"
          >
            Create your first card
          </h2>
          <p class="text-[12px] leading-[18px] tracking-[0.12px] text-fg-3">
            Issue a virtual card for the company or a team member. Fund it from
            your balances, set a daily limit and freeze it any time.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <LinkButton href="/cards/new" size="xxs">
            <template #leadingIcon><RiAddLine /></template>
            Create card
          </LinkButton>
          <p
            class="flex items-center gap-1 text-[12px] leading-[18px] text-fg-3"
            data-testid="creation-fee"
          >
            <RiInformationLine class="size-3.5" aria-hidden="true" />
            <span class="tnum">{{ fee }}</span> one-time fee per card, paid from
            your balance
          </p>
        </div>
      </div>
      <p class="pb-4 text-[12px] leading-[18px] tracking-[0.12px] text-fg-3">
        By creating a card you agree to the
        <button
          type="button"
          class="font-medium text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
          @click="terms = true"
        >
          card terms and conditions</button
        >. See the
        <button
          type="button"
          class="font-medium text-fg underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-focus"
          @click="terms = true"
        >
          limits and fees</button
        >.
      </p>
      <hr class="border-line" />
      <ul class="mt-4 flex flex-wrap gap-x-10 gap-y-2" aria-label="Features">
        <li
          v-for="f in FEATURES"
          :key="f.label"
          class="flex items-center gap-1 text-[12px] leading-[18px] font-medium tracking-[0.12px] text-fg-2"
        >
          <component :is="f.icon" class="size-3.5" aria-hidden="true" />
          {{ f.label }}
        </li>
      </ul>
    </div>
  </section>
  <CardTermsModal v-model:open="terms" />
</template>

<style scoped>
.card-flip {
  animation: card-flip 4s ease-in-out infinite;
}
@keyframes card-flip {
  0%,
  72% {
    transform: rotateY(0deg);
  }
  80% {
    transform: rotateY(90deg);
  }
  80.01% {
    transform: rotateY(-90deg);
  }
  88%,
  100% {
    transform: rotateY(0deg);
  }
}
</style>
