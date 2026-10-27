<script setup lang="ts">
/**
 * A card seated in the pocket. Private to ForenAccountWallet.
 *
 * The hover target is the card, not the wallet — and because the pocket front
 * sits above it and takes the hit test over its own area, only the card's
 * exposed peek responds. The card lifts away from the cursor, so the pointer
 * stays inside it and the state cannot oscillate. The tilt is randomised per hover.
 */
import { ref } from "vue";
import { CARD_DEPTH, CARD_HEIGHT, CARD_RADIUS, CARD_STACK_STEP, CARD_TOP, CARD_WIDTH, LIFT, metalFace, randomTilt, type ForenAccount, type ForenMetalStops } from "./foren-account-wallet";

defineProps<{ account: ForenAccount; metal: ForenMetalStops; depth: number; restTilt: number }>();
const tilt = ref<number | null>(null);

function onEnter() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  tilt.value = randomTilt();
}
</script>

<template>
  <div
    class="absolute left-1/2 transition-transform duration-200 ease-[cubic-bezier(0.34,1.34,0.62,1)] will-change-transform"
    :style="{
      top: `${CARD_TOP - depth * CARD_STACK_STEP}px`,
      transform: `translateX(-50%) translateY(${tilt === null ? 0 : -LIFT}px) rotate(${restTilt + (tilt ?? 0)}deg)`,
    }"
    @pointerenter="onEnter"
    @pointerleave="tilt = null"
  >
    <div
      class="relative"
      :style="{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px`, borderRadius: `${CARD_RADIUS}px`, backgroundImage: metalFace(metal), boxShadow: CARD_DEPTH }"
    >
      <div class="absolute flex items-center justify-between" :style="{ inset: '14px 14px auto 14px' }">
        <span class="flex items-center gap-2">
          <img :src="account.flagSrc" alt="" width="16" height="16" class="shrink-0 rounded-full" />
          <span class="font-[family-name:var(--font-inter)] text-[14px] leading-[21px] font-semibold tracking-[0.14px] text-[#444]">
            {{ account.label }}
          </span>
        </span>
        <span class="font-[family-name:var(--font-inter)] text-[14px] leading-[21px] font-semibold tracking-[0.14px] text-[#444] tabular-nums">
          {{ account.amount }}
        </span>
      </div>
    </div>
  </div>
</template>
